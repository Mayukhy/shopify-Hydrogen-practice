import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the context
const FilterSortContext = createContext();

// Provider component
export function FilterSortProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  // Handle loading state for product grid DOM manipulation
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const productGrid = document.querySelector('.products-grid');
      if (productGrid) {
        if (isLoading) {
          productGrid.classList.add('loading');
        } else {
          productGrid.classList.remove('loading');
        }
      }
    }
  }, [isLoading]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <FilterSortContext.Provider value={{
        isLoading,
        setIsLoading,
        startLoading,
        stopLoading
    }}>
      {children}
    </FilterSortContext.Provider>
  );
}

// Custom hook to use the context
export const useFilterSort = () => {
  const context = useContext(FilterSortContext);
  if (!context) {
    throw new Error('useFilterSort must be used within a FilterSortProvider');
  }
  return context;
};