import {Await, useLoaderData, Link} from 'react-router';
import {Suspense, useEffect, useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {ProductSliderItem} from '~/components/ProductSliderItem';
import { QuickAddProvider } from '~/components/QuickAddProvider';
import { useAside } from '~/components/Aside';
import { AddToCartButton } from '~/components/AddToCartButton';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context}) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  // Get collection products for the slider
  const [{collection}] = await Promise.all([
    context.storefront.query(COLLECTION_QUERY, {
      variables: {
        handle: collections.nodes[0].handle,
      },
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  return {
    featuredCollection: collections.nodes[0],
    products: collection.products.nodes || [],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
      <CollectionSlider 
        collection={data.featuredCollection}
        products={data.products} 
      />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <QuickAddProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <Await resolve={products}>
            {(response) => (
                <div className="recommended-products-grid">
                  {response
                    ? response.products.nodes.map((product) => (
                        <ProductItem key={product.id} product={product} />
                      ))
                    : null}
                </div>
            )}
          </Await>
        </Suspense>
      </QuickAddProvider>
      <br />
    </div>
  );
}

/**
 * CollectionSlider Component - Renders a vertical product slider with add-to-cart functionality
 * @param {{
 *   collection: FeaturedCollectionFragment; // The featured collection data containing title, handle, and image
 *   products: Array; // Array of product objects to display in the slider
 * }}
 */
function CollectionSlider({collection, products}) {
  // DOM reference for the Swiper container element
  const swiperRef = useRef(null);
  
  // Reference to store the Swiper instance to prevent unnecessary re-initialization
  const swiperInstanceRef = useRef(null);
  
  const [ currentSlideIndex, setCurrentSlideIndex ] = useState(0);
  const [currentProductData, setCurrentProductData] = useState(products?.[0]);
  // Size variants available for the current product (e.g., S, M, L, XL)
  const [SizeVariants, setSizeVariants] = useState([products[0]?.options?.find(opt => opt.name.toLowerCase() === 'size')?.optionValues || []]);
  
  // Controls the visibility/animation of variant options display
  const [showVariants, setShowVariants] = useState(false);
  
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const {open} = useAside();
  
  // Currently selected product variant based on user's size choice
  const [currentVariant, setCurrentVariant] = useState(null);

  // Effect: Initialize current variant when size variants change
  // This ensures a variant is selected when the product changes
  useEffect(() => {
    const variant = getCurrentVariant(SizeVariants[0]?.name);
    setCurrentVariant(variant);
  }, [SizeVariants]);


  // Effect: Update size variants when slide changes
  // Fetches and displays available sizes for the current product
  useEffect(() => {
    if (products && products.length > 0) {
      // Find size options for the current product slide
      const newVariants = products[currentSlideIndex]?.options?.find(opt => opt.name.toLowerCase() === 'size')?.optionValues || [];
      
      // Hide variants first for smooth transition animation
      setShowVariants(false);
      
      // Update variants with a delay for better UX
      setTimeout(() => {
        setSizeVariants(newVariants);
        if (newVariants.length > 0) {
          setShowVariants(true);
        }
      }, 200); // 200ms delay for smooth transition
    }
  }, [products, currentSlideIndex]);

  // Effect: Update current product data when slide index changes
  // Keeps product information in sync with the active slide
  useEffect(() => {
    if (products && products.length > 0) {
      setCurrentProductData(products[currentSlideIndex] || products[0]);
    }
  }, [products, currentSlideIndex]);
  
  // Effect: Initialize and manage Swiper slider instance
  // Only re-initializes when products change, preserves slide position on re-renders
  useEffect(() => {
    /**
     * Initialize Swiper slider with vertical direction and pagination
     * Preserves current slide position to prevent auto-reset to slide 1
     */
    const initSwiper = async () => {
      // Only initialize if DOM is ready and products are available
      if (typeof window !== 'undefined' && swiperRef.current && products?.length > 0) {
        try {
          // Check if Swiper instance already exists
          if (swiperInstanceRef.current) {
            // If Swiper exists but slide position is wrong, update it
            if (swiperInstanceRef.current.activeIndex !== currentSlideIndex) {
              swiperInstanceRef.current.slideToLoop(currentSlideIndex, 0);
            }
            return; // Exit early to prevent re-initialization
          }

          // Dynamically import Swiper modules to reduce bundle size
          const [{ default: Swiper }, { Navigation, Pagination, EffectFade }] = await Promise.all([
            import('swiper'),
            import('swiper/modules')
          ]);
          
          // Create new Swiper instance with configuration
          swiperInstanceRef.current = new Swiper(swiperRef.current, {
            direction: 'vertical', // Vertical sliding direction
            slidesPerView: 1, // Show one slide at a time
            modules: [Navigation, Pagination, EffectFade], // Required Swiper modules
            loop: products.length > 3, // Enable loop only if more than 3 products
            autoHeight: false, // Fixed height for consistent layout
            height: Math.round(window.innerHeight * 1.1), // Height based on viewport
            
            // Navigation arrows (currently disabled)
            // navigation: {
            //   nextEl: '.collection-slider-next',
            //   prevEl: '.collection-slider-prev',
            // },
            
            // Pagination dots configuration
            pagination: {
              el: '.collection-slider-pagination',
              clickable: true, // Allow clicking on pagination dots
              dynamicBullets: true, // Show dynamic bullet pagination
            },
            
            // Animation and interaction settings
            speed: 600, // Transition speed in milliseconds
            simulateTouch: true, // Enable mouse drag simulation
            effect: 'coverflow', // Visual effect for transitions
            initialSlide: currentSlideIndex, // Start at current slide to preserve position
            
            // Event handlers for slide changes
            on: {
              // Called when user manually changes slides
              slideChange: function () {
                const realIndex = this.realIndex;
                setCurrentSlideIndex(realIndex);
                setCurrentProductData(products[realIndex]);
              },
              
              // Called when Swiper initializes
              init: function () {
                // Preserve current slide index if it differs from Swiper's initial state
                const realIndex = this.realIndex || currentSlideIndex;
                if (realIndex !== currentSlideIndex) {
                  setCurrentSlideIndex(realIndex);
                  setCurrentProductData(products[realIndex]);
                }
              }
            }
          });

          // Navigate to preserved slide position after initialization
          if (currentSlideIndex > 0) {
            setTimeout(() => {
              if (swiperInstanceRef.current) {
                swiperInstanceRef.current.slideToLoop(currentSlideIndex, 0);
              }
            }, 100); // Small delay to ensure Swiper is fully initialized
          }
        } catch (error) {
          console.error('Error initializing Swiper:', error);
        }
      }
    };

    // Delay initialization to ensure DOM is fully ready
    const timer = setTimeout(() => {
      initSwiper();
    }, 300);
    
    // Cleanup timer on component unmount or dependency change
    return () => {
      clearTimeout(timer);
      // Note: We don't destroy Swiper here to preserve instance across re-renders
    };
  }, [products]); // Only re-run when products array changes

  // Effect: Cleanup Swiper instance on component unmount
  // Prevents memory leaks by properly destroying Swiper when component is removed
  useEffect(() => {
    return () => {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
    };
  }, []);

  /**
   * Handles adding the current variant to cart with loading state and error handling
   * Prevents slider reset by avoiding unnecessary re-renders during cart operations
   * 
   * @param {Event} event - The click event from the add to cart button
   * @description Workflow:
   * 1. Prevents default form behavior
   * 2. Sets loading state to show user feedback
   * 3. Submits the add-to-cart form
   * 4. Shows loading animation for 1 second
   * 5. Opens cart sidebar
   * 6. Resets loading state
   */
  const handleAddToCart = async (event) => {
    event.preventDefault();
    setIsAddingToCart(true);
    
    try {
      await event.target.form.requestSubmit();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await open('cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * Updates the selected product variant based on chosen size
   * 
   * @param {string} size - The size variant name (e.g., "S", "M", "L", "XL")
   */
  const changeVariant = (size) => {
    const variant = getCurrentVariant(size);
    setCurrentVariant(variant);
  }

  /**
   * Finds and returns the product variant matching the specified size
   * 
   * @param {string} size - The size to search for in variant options
   * @returns {Object|undefined} The matching variant object or undefined if not found
   */
  const getCurrentVariant = (size) => {
    return currentProductData.variants?.nodes.find(variant => 
      variant.selectedOptions.some(opt => opt.value === size)
    );
  }

  // Early return if required data is missing
  // Prevents rendering slider without proper collection or product data
  if (!collection || !products || products.length === 0) {
    return null;
  }

  return (
    <div className="collection-slider-section">
      {/* Header section with collection title and "View All" link */}
      <div className="collection-slider-header">
        <div className="header-content">
          <h2>Latest from {collection.title}</h2>
        </div>
        <Link to={`/collections/${collection.handle}`} className="view-all-link">
          View All →
        </Link>
      </div>

      {/* Current product information display */}
      {/* Shows product name, vendor, price, and slide progress indicator */}
      {currentProductData && (
        <div className="current-product-info">
          <div className="product-info-content">
            <h3 className="product-title">{currentProductData.title}</h3>
            <div className="product-details">
              {/* Display product vendor if available */}
              {currentProductData.vendor && (
                <span className="product-vendor">by {currentProductData.vendor}</span>
              )}
              {/* Display formatted price from first variant */}
              {currentProductData.variants?.nodes?.[0]?.price && (
                <span className="product-price">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currentProductData.variants.nodes[0].price.currencyCode,
                  }).format(currentProductData.variants.nodes[0].price.amount)}
                </span>
              )}
            </div>
            {/* Slide position indicator with progress bar */}
            <div className="slide-indicator">
              <span className="slide-counter">{currentSlideIndex + 1} / {products.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${((currentSlideIndex + 1) / products.length) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product variant options (sizes) display */}
      {/* Shows available sizes with smooth show/hide animations */}
      {SizeVariants && SizeVariants.length > 0 && (
        <div className={`product-variants ${showVariants ? 'show' : ''}`}>
          {SizeVariants.map((variant, index) => (
            <div 
              key={variant.name || index} 
              className={`product-variant ${currentVariant?.selectedOptions?.some(opt => opt.value === variant.name) ? 'selected' : ''}`}
              style={{ 
                animationDelay: `${index * 50}ms` // Staggered animation for each variant
              }}
              onClick={() => {
                // Handle variant selection when user clicks on size option
                changeVariant(variant.name);
              }}
            >
              <span className="variant-title">{variant.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add to cart button */}
      {/* Only renders when a variant is selected, shows loading state during cart operations */}
      {currentVariant && (
        <div 
          className="add-to-cart-container"
          key={`cta-${currentVariant?.id}`} // Key based on variant ID to prevent unnecessary re-renders
        >
            <AddToCartButton
              disabled={!currentVariant?.availableForSale || isAddingToCart}
              lines={
                currentVariant
                  ? [
                      {
                        merchandiseId: currentVariant.id,
                        quantity: 1,
                      },
                    ]
                  : []
              }
              onClick={(e) => handleAddToCart(e)}
            >
              {/* Dynamic button text based on loading state and variant availability */}
              {isAddingToCart ? (
                <div className="loading-button-content">
                  <div className="loading-spinner"></div>
                  Adding...
                </div>
              ) : currentVariant?.availableForSale ? (
                `Add to Bag 🛒 Size of "${currentVariant?.selectedOptions.find(option => option.name === 'Size')?.value}"`
              ) : (
                'Sold Out'
              )}
            </AddToCartButton>
        </div>
      ) }

      {/* Main slider container */}
      {/* Contains Swiper slider with product slides and pagination */}
      <div className="collection-slider-container">
        <div className="swiper" ref={swiperRef}>
          <div className="swiper-wrapper">
            {/* Generate slide for each product */}
            {products.map((product, index) => (
              <div key={product.id} className="swiper-slide">
                <ProductSliderItem
                  product={product} 
                  currentProductData={currentProductData}
                  currentSlideIndex={currentSlideIndex}
                  products={products}
                  loading={index < 3 ? 'eager' : 'lazy'} // Eager load first 3 slides for performance
                />
              </div>
            ))}
          </div>
          
          {/* Swiper pagination dots */}
          <div className="swiper-pagination collection-slider-pagination"></div>
        </div>
      </div>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
  fragment ProductItem on Product {
    id
    handle
    title
    vendor
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    variants(first: 100) {
      nodes {
        id
        availableForSale
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: 10) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    variants(first: 100) {
      nodes {
        id
        availableForSale
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
      }
    }
  }
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
