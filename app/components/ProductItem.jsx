import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {QuickAddModal} from './QuickAddModal';
import {useQuickAdd} from './QuickAddProvider';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const {openModal, closeModal, isModalOpen, isMobile} = useQuickAdd();
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  
  // Check if product has multiple variants to show quick add
  const hasVariants = product.variants?.nodes?.length > 1;
  const hasOptions = product.options?.length > 0;
  const showQuickAdd = hasVariants && hasOptions;

  const handleQuickAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(product.id);
    if (!isMobile) return;
    e.target.closest('.quick-add-btn').style.opacity = 0;
  };

  return (
    <div className="product-item-wrapper product-item" data-product-id={product.id}>
      <div className="product-item">
        <Link
          key={product.id}
          prefetch="intent"
          to={variantUrl}
          className="product-item-link"
          onClick={() => closeModal()} // Close modal when navigating to product page
        >
          {image && (
            <div className="product-item-image-container">
              <Image
                alt={image.altText || product.title}
                aspectRatio="1/1"
                data={image}
                loading={loading}
                sizes="(min-width: 45em) 400px, 100vw"
              />
              {showQuickAdd && (
                <button
                  className="quick-add-btn"
                  onClick={handleQuickAddClick}
                  aria-label={`Quick add ${product.title}`}
                >
                  Add to bag
                </button>
              )}
            </div>
          )}
          <div className="product-item-info">
            <h4>{product.title}</h4>
            <small>
              <Money data={product.priceRange.minVariantPrice} />
            </small>
          </div>
        </Link>
      </div>
      
      <QuickAddModal
        product={product}
        isOpen={isModalOpen(product.id)}
        onClose={closeModal}
      />
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
