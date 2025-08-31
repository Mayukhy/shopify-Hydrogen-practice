/**
 * Convert price range string to min/max object
 * @param {string} priceRange - Price range string like "25-50"
 * @returns {Object} Object with min and max properties
 */
export function convertPriceRange(priceRange) {
  switch (priceRange) {
    case '0-25':
      return {min: 0, max: 25};
    case '25-50':
      return {min: 25, max: 50};
    case '50-100':
      return {min: 50, max: 100};
    case '100-200':
      return {min: 100, max: 200};
    case '200-40000':
      return {min: 200, max: 40000};
    default:
      return {min: null, max: null};
  }
}

/**
 * Build GraphQL filters array from URL search parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Array} Array of filter objects for GraphQL query
 */
export function buildFiltersFromSearchParams(searchParams) {
  const filters = [];

  // Basic filters
  if (searchParams.get('availability')) {
    filters.push({available: searchParams.get('availability') === 'true'});
  }

  if (searchParams.get('vendor')) {
    filters.push({productVendor: searchParams.get('vendor')});
  }

  if (searchParams.get('productType')) {
    filters.push({productType: searchParams.get('productType')});
  }

  // Price filter
  if (searchParams.get('price')) {
    const priceRange = convertPriceRange(searchParams.get('price'));
    if (priceRange && (priceRange.min !== null || priceRange.max !== null)) {
      const priceFilter = {price: {}};
      if (priceRange.min !== null) priceFilter.price.min = priceRange.min;
      if (priceRange.max !== null) priceFilter.price.max = priceRange.max;
      filters.push(priceFilter);
    }
  }

  // Variant filters
  searchParams.forEach((value, key) => {
    if (key.startsWith('variant_')) {
      const optionName = key.replace('variant_', '');
      filters.push({
        variantOption: {
          name: optionName,
          value: value,
        },
      });
    }
  });

  return filters;
}

/**
 * Get sort key from search parameters with fallback
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {string|undefined} Sort key or undefined for default
 */
export function getSortKeyFromParams(searchParams) {
  const sortKey = searchParams.get('sort') || 'COLLECTION_DEFAULT';
  return sortKey !== 'COLLECTION_DEFAULT' ? sortKey : undefined;
}
