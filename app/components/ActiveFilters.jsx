import React from 'react';
import {useNavigate, useSearchParams} from 'react-router';

export default function ActiveFilters({filters}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const removeFilter = (filter, index) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (filter.available !== undefined) {
      newSearchParams.delete(`availability`);
    }
    if (filter.productVendor) {
      newSearchParams.delete(`vendor`);
    }
    if (filter.productType) {
      newSearchParams.delete(`productType`);
    }
    if (filter.price) {
      newSearchParams.delete(`price`);
    }
    if (filter.variantOption) {
      // Remove the specific variant filter parameter
      const paramName = `variant_${filter.variantOption.name}`;
      const currentValues = newSearchParams.getAll(paramName);
      newSearchParams.delete(paramName);

      // Re-add all values except the one we're removing
      currentValues.forEach((value) => {
        if (value !== filter.variantOption.value) {
          newSearchParams.append(paramName, value);
        }
      });
    }
    navigate(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="active-filters-container">
      {filters.map((filter, idx) => (
        <span className="active-filter" key={idx}>
          {filter.variantOption &&
            `${filter.variantOption.name}: ${filter.variantOption.value} `}
          {filter.price && `Price: $${filter.price.min} - $${filter.price.max}`}
          {filter.productVendor && `Vendor: ${filter.productVendor}`}
          {filter.productType && `Type: ${filter.productType}`}
          {filter.available !== undefined &&
            (filter.available ? 'In Stock' : 'Out of Stock')}
          <button
            className="remove-filter"
            onClick={() => removeFilter(filter, idx)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-x"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
