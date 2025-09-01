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

  // Process all search parameters using forEach
  searchParams.forEach((value, key) => {
    switch (key) {
      case 'availability':
        filters.push({available: value === 'true'});
        break;
      
      case 'vendor':
        filters.push({productVendor: value});
        break;
      
      case 'productType':
        filters.push({productType: value});
        break;
      
      case 'price':
        const priceRange = convertPriceRange(value);
        if (priceRange && (priceRange.min !== null || priceRange.max !== null)) {
          const priceFilter = {price: {}};
          if (priceRange.min !== null) priceFilter.price.min = priceRange.min;
          if (priceRange.max !== null) priceFilter.price.max = priceRange.max;
          filters.push(priceFilter);
        }
        break;
      
      default:
        // Handle variant filters
        if (key.startsWith('variant_')) {
          const optionName = key.replace('variant_', '');
          filters.push({
            variantOption: {
              name: optionName,
              value: value,
            },
          });
        }
        break;
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

/**
 * Parse filters from search parameters for UI state
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed filters object for component state
 */
export function parseFiltersFromSearchParams(searchParams) {
  const filters = {
    priceRange: {min: null, max: null}, // Always ensure priceRange exists
    variantOptions: [], // Initialize variant options
  };
  
  searchParams.forEach((value, key) => {
    if (key === 'price') {
      filters['priceRange'] = convertPriceRange(value);
    } else if (key.startsWith('variant_')) {
      // Handle variant filters
      const optionName = key.replace('variant_', '');
      if (!filters.variantOptions) {
        filters.variantOptions = [];
      }
      filters.variantOptions.push({
        variantOption: {
          name: optionName,
          value: value,
        },
      });
    } else {
      filters[key] = value;
    }
  });
  
  return filters;
}
