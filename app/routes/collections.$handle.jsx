import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {QuickAddProvider} from '~/components/QuickAddProvider';
import {FilterSidebar, FilterToggleButton} from '~/components/FilterSidebar';
import {CollectionSort} from '~/components/CollectionSort';
import {FilterSortProvider} from '~/components/FilterSortProvider';
import {useState} from 'react';
import {
  buildFiltersFromSearchParams,
  getSortKeyFromParams,
} from '~/utils/filters';
import ActiveFilters from '~/components/ActiveFilters';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
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
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Get sort parameter and build filters using utility functions
  const sortKey = getSortKeyFromParams(searchParams);
  const filters = buildFiltersFromSearchParams(searchParams);

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        sortKey,
        filters: filters.length > 0 ? filters : undefined,
      },
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    filters,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection, filters} = useLoaderData();
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const handleFilterOpen = () => {
    setIsFilterOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <FilterSortProvider>
      <div className="collection-page">
        <FilterSidebar
          collection={collection}
          isOpen={isFilterOpen}
          onClose={handleFilterClose}
        />

        <div className="collection-main">
          <div className="collection-header">
            <div className="collection-title-section">
              <h1>{collection.title}</h1>
              <p className="collection-description">{collection.description}</p>
            </div>
          </div>

          <div className="collection-controls">
            <FilterToggleButton
              filtersCount={filters.length}
              onClick={handleFilterOpen}
            />
            <ActiveFilters filters={filters} />
            <CollectionSort />
          </div>
          <QuickAddProvider>
            <PaginatedResourceSection
              connection={collection.products}
              resourcesClassName="products-grid"
            >
              {/* <QuickAddProvider> */}
              {({node: product, index}) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading={index < 8 ? 'eager' : undefined}
                />
              )}
              {/* </QuickAddProvider> */}
            </PaginatedResourceSection>
          </QuickAddProvider>
          <Analytics.CollectionView
            data={{
              collection: {
                id: collection.id,
                handle: collection.handle,
              },
            }}
          />
        </div>
      </div>
    </FilterSortProvider>
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

// NOTE: https://shopify.dev/docs/api/storefront/2024-07/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey
      ) {
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
