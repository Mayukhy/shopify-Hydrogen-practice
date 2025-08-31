import {useEffect, useState} from 'react';
import {useSearchParams, useNavigate} from 'react-router';
import {convertPriceRange} from '~/utils/filters';

export function CollectionFilters({collection}) {
  const hasActiveFilters = Array.from(useSearchParams()[0].keys()).length > 0;
  const [currentFilters, setCurrentFilters] = useState({
    availability: '',
    vendor: '',
    productType: '',
    priceRange: {min: null, max: null},
    variantOptions: [],
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
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

    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      ...filters,
    }));
  }, [searchParams]);
  // Get filter options from products
  const filterOptions = getFilterOptions(collection.products.nodes);

  const updateBasicFilter = (filterName, filterValue) => {
    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: filterValue,
    }));
    const newSearchParams = new URLSearchParams(searchParams);
    if (!filterValue) {
      newSearchParams.delete(filterName);
    } else {
      newSearchParams.set(filterName, filterValue);
    }
    navigate(`?${newSearchParams.toString()}`);
  };

  const updatePriceFilter = (priceRange) => {
    const priceObj = convertPriceRange(priceRange);
    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      priceRange: priceObj,
    }));
    const newSearchParams = new URLSearchParams(searchParams);
    if (!priceRange) {
      newSearchParams.delete('price');
    } else {
      newSearchParams.set('price', priceRange);
    }
    navigate(`?${newSearchParams.toString()}`);
  };

  const updateVariantFilter = (optionName, optionValue, isChecked) => {
    setCurrentFilters((prevFilters) => {
      let variantOptions = [...prevFilters.variantOptions];
      if (isChecked) {
        variantOptions.push({
          variantOption: {
            name: optionName,
            value: optionValue,
          },
        });
      } else {
        variantOptions = variantOptions.filter(
          (option) =>
            !(
              option.variantOption.name === optionName &&
              option.variantOption.value === optionValue
            ),
        );
      }
      return {
        ...prevFilters,
        variantOptions,
      };
    });

    const newSearchParams = new URLSearchParams(searchParams);

    if (isChecked) {
      // Add the variant filter parameter
      newSearchParams.append(`variant_${optionName}`, optionValue);
    } else {
      // Remove the specific variant filter parameter
      const paramName = `variant_${optionName}`;
      const currentValues = newSearchParams.getAll(paramName);
      newSearchParams.delete(paramName);

      // Re-add all values except the one we're removing
      currentValues.forEach((value) => {
        if (value !== optionValue) {
          newSearchParams.append(paramName, value);
        }
      });
    }

    navigate(`?${newSearchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setCurrentFilters({
      availability: '',
      vendor: '',
      productType: '',
      priceRange: {min: null, max: null},
      variantOptions: [],
    });
    const newSearchParams = new URLSearchParams();
    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="collection-filters">
      {hasActiveFilters && (
        <div className="active-filters-section">
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear All Filters
          </button>
        </div>
      )}

      <div className="filters-container">
        {/* Basic Filters */}
        <div className="filter-section basic-filters">
          <h3 className="filter-section-title">Basic Filters</h3>

          {/* Availability Filter */}
          <div className="filter-group">
            <label htmlFor="availability-filter" className="filter-label">
              Availability
            </label>
            <div className="filter-input-wrapper">
              <select
                id="availability-filter"
                value={currentFilters.availability}
                onChange={(e) =>
                  updateBasicFilter('availability', e.target.value)
                }
                className="filter-select"
              >
                <option value="">All Products</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Price Filter */}
          <div className="filter-group">
            <label htmlFor="price-filter" className="filter-label">
              Price Range
            </label>
            <div className="filter-input-wrapper">
              <select
                id="price-filter"
                value={
                  currentFilters.priceRange &&
                  currentFilters.priceRange.min !== null &&
                  currentFilters.priceRange.max !== null
                    ? `${currentFilters.priceRange.min}-${currentFilters.priceRange.max}`
                    : currentFilters.priceRange &&
                        currentFilters.priceRange.max === null &&
                        currentFilters.priceRange.min !== null
                      ? `${currentFilters.priceRange.min}+`
                      : ''
                }
                onChange={(e) => {
                  updatePriceFilter(e.target.value);
                }}
                className="filter-select"
              >
                <option value="">All Prices</option>
                <option value="0-25">$0 - $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200-40000">$200+</option>
              </select>
            </div>
          </div>

          {/* Vendor Filter */}
          {filterOptions.vendors.length > 1 && (
            <div className="filter-group">
              <label htmlFor="vendor-filter" className="filter-label">
                Brand
              </label>
              <div className="filter-input-wrapper">
                <select
                  id="vendor-filter"
                  value={currentFilters.vendor}
                  onChange={(e) => updateBasicFilter('vendor', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Brands</option>
                  {filterOptions.vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Product Type Filter */}
          {filterOptions.productTypes.length > 1 && (
            <div className="filter-group">
              <label htmlFor="productType-filter" className="filter-label">
                Product Type
              </label>
              <div className="filter-input-wrapper">
                <select
                  id="productType-filter"
                  value={currentFilters.productType}
                  onChange={(e) =>
                    updateBasicFilter('productType', e.target.value)
                  }
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  {filterOptions.productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Variant Option Filters */}
        {filterOptions.variantOptions.length > 0 && (
          <div className="filter-section variant-filters">
            <h3 className="filter-section-title">Product Options</h3>

            {filterOptions.variantOptions.map(
              (option) =>
                option.values.length > 1 && (
                  <div
                    key={option.name}
                    className="filter-group variant-filter-group"
                  >
                    <label className="filter-label">{option.name}</label>

                    {/* Color and Size variants use checkboxes */}
                    {['Color', 'Size'].includes(option.name) ? (
                      <div
                        className={`checkbox-grid ${option.name.toLowerCase()}-grid`}
                      >
                        {option.values.map((value) => {
                          const isChecked =
                            currentFilters.variantOptions.some(
                              (filterOption) =>
                                filterOption.variantOption.name ===
                                  option.name &&
                                filterOption.variantOption.value === value,
                            ) || false;
                          return (
                            <label
                              key={value}
                              className={`checkbox-item ${option.name.toLowerCase()}-item ${isChecked ? 'checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  updateVariantFilter(
                                    option.name,
                                    value,
                                    e.target.checked,
                                  )
                                }
                                className="checkbox-input"
                              />
                              <span className="checkbox-label">
                                {option.name === 'Color' && (
                                  <span
                                    className="color-swatch"
                                    style={{
                                      backgroundColor: value.toLowerCase(),
                                    }}
                                    aria-label={value}
                                  />
                                )}
                                <span className="checkbox-text">{value}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      /* Other variants use select dropdown */
                      <div className="filter-input-wrapper">
                        <select
                          value={
                            currentFilters.variantOptions.find(
                              (filterOption) =>
                                filterOption.variantOption.name === option.name,
                            )?.variantOption.value || ''
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            // First, remove any existing filters for this option name
                            const existingFilter =
                              currentFilters.variantOptions.find(
                                (filterOption) =>
                                  filterOption.variantOption.name ===
                                  option.name,
                              );
                            if (existingFilter) {
                              updateVariantFilter(
                                option.name,
                                existingFilter.variantOption.value,
                                false,
                              );
                            }
                            // Then add the new filter if a value was selected
                            if (value) {
                              updateVariantFilter(option.name, value, true);
                            }
                          }}
                          className="filter-select"
                        >
                          <option value="">All {option.name}s</option>
                          {option.values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getFilterOptions(products) {
  const vendors = [
    ...new Set(products.map((product) => product.vendor).filter(Boolean)),
  ];
  const productTypes = [
    ...new Set(products.map((product) => product.productType).filter(Boolean)),
  ];

  // Extract variant options
  const variantOptionsMap = new Map();

  products.forEach((product) => {
    if (product.options) {
      product.options.forEach((option) => {
        if (!variantOptionsMap.has(option.name)) {
          variantOptionsMap.set(option.name, new Set());
        }

        if (option.optionValues) {
          option.optionValues.forEach((optionValue) => {
            variantOptionsMap.get(option.name).add(optionValue.name);
          });
        }
      });
    }
  });

  // Convert to array format
  const variantOptions = Array.from(variantOptionsMap.entries()).map(
    ([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet).sort(),
    }),
  );

  return {
    vendors: vendors.sort(),
    productTypes: productTypes.sort(),
    variantOptions: variantOptions,
  };
}
