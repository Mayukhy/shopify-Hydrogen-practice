import React, { useState } from 'react';

export default function Accordion({ 
  title, 
  children, 
  isOpenByDefault = false, 
  className = '', 
  headerClassName = '',
  contentClassName = '',
  icon = true ,
  filters
}) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  let filterCount = 0
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };
 
  if (filters && filters.length > 0) {
    const optionFilters = filters.filter(f => f.variantOption.name === title);
    filterCount = optionFilters.length;
  }
  else
    filterCount = 0;

  return (
    <div className={`accordion ${className}`}>
      <div 
        className={`accordion-header ${headerClassName}`}
        onClick={toggleAccordion}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAccordion();
          }
        }}
        aria-expanded={isOpen}
        aria-controls="accordion-content"
      >
        <span className="accordion-title">{title} {filterCount > 0 && `(${filterCount})`}</span>
        {icon && (
          <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>
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
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
        )}
      </div>
      
      <div 
        id="accordion-content"
        className={`accordion-content ${contentClassName} ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="accordion-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
