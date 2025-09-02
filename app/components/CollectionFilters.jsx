import {useEffect, useState} from 'react';
import {useSearchParams, useNavigate} from 'react-router';
import {convertPriceRange, parseFiltersFromSearchParams} from '~/utils/filters';
import Accordion from './common/Accordian';
import {useFilterSort} from './FilterSortProvider';

export function CollectionFilters({collection}) {
  const hasActiveFilters = Array.from(useSearchParams()[0].keys()).length > 0;
  const { startLoading, stopLoading, isLoading } = useFilterSort();
  
  const [currentFilters, setCurrentFilters] = useState({
    availability: '',
    vendor: '',
    productType: '',
    priceRange: {min: null, max: null},
    variantOptions: [],
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter options from products
  const filterOptions = getFilterOptions(collection.products.nodes);

  // Handle filter updates from search params
  useEffect(() => {
    const filters = parseFiltersFromSearchParams(searchParams);
    setCurrentFilters((prevFilters) => ({
      ...prevFilters,
      ...filters,
    }));
    // Stop loading when filters are updated
    console.log('Filters updated, stopping loading');
    stopLoading();
  }, [searchParams, stopLoading]);

  const updateBasicFilter = (filterName, filterValue) => {
    console.log('updateBasicFilter called, starting loading');
    startLoading();
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
    console.log('updatePriceFilter called, starting loading');
    startLoading();
    const newSearchParams = new URLSearchParams(searchParams);
    if (!priceRange) {
      newSearchParams.delete('price');
    } else {
      newSearchParams.set('price', priceRange);
    }
    navigate(`?${newSearchParams.toString()}`);
  };

  const updateVariantFilter = (optionName, optionValue, isChecked) => {
    console.log('updateVariantFilter called, starting loading');
    startLoading();
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
    console.log('clearAllFilters called, starting loading');
    startLoading();
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
          <Accordion
          title="Availability" 
          isOpenByDefault={false}
          className="custom-accordion-availability"
          >
            <div className="filter-group">
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
          </Accordion>

          {/* Price Filter */}
          <Accordion
            title="Price Range"
            isOpenByDefault={false}
            className="custom-accordion-price"
          >
          <div className="filter-group">
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
          </Accordion>

          {/* Vendor Filter */}
          {filterOptions.vendors.length > 1 && (
            <Accordion
              title="Brand"
              isOpenByDefault={false}
              className="custom-accordion-vendor"
            >
              <div className="filter-group">
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
            </Accordion>
          )}

          {/* Product Type Filter */}
          {filterOptions.productTypes.length > 1 && (
            <Accordion
              title="Product Type"
              isOpenByDefault={false}
              className="custom-accordion-product-type"
            >
              <div className="filter-group">
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
            </Accordion>
          )}
        </div>

        {/* Variant Option Filters */}
        {filterOptions.variantOptions.length > 0 && (
          <div className="filter-section variant-filters">
            <h3 className="filter-section-title">Product Options</h3>
            {filterOptions.variantOptions.map(
              (option) =>
                option.values.length > 1 && (
                  <Accordion
                    title={option.name}
                    isOpenByDefault={false}
                    className="custom-accordion-variant"
                    filters={currentFilters.variantOptions || []}
                  >
                    <div
                      key={option.name}
                      className="filter-group variant-filter-group"
                    >

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
                  </Accordion>
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
