import {useState, useEffect} from 'react';
import {CollectionFilters} from './CollectionFilters';

export function FilterSidebar({collection, isOpen, onClose}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClick = (e) => {
      if (
        !e.target.closest('.filter-sidebar') &&
        !e.target.classList.contains('filter-toggle-btn')
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="filter-overlay" onClick={onClose} aria-hidden="true" />
      )}

      {/* Sidebar/Drawer */}
      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="filter-sidebar-header">
          <div className="filter-header-content">
            <h2 className="filter-title">Filters</h2>
            <div className="filter-header-actions">
              <button
                className="filter-close-btn"
                onClick={onClose}
                aria-label="Close filters"
              >
                <svg
                  width="20"
                  height="20"
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
              </button>
            </div>
          </div>
        </div>

        <div className="filter-sidebar-content">
          <CollectionFilters collection={collection} />
        </div>
      </aside>
    </>
  );
}

export function FilterToggleButton({onClick, filtersCount}) {
  return (
    <button
      className="filter-toggle-btn"
      onClick={onClick}
      aria-label="Open filters"
    >
      <div className="filter-toggle-content">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
        </svg>
        <span className="filter-toggle-text">Filters</span>
        {filtersCount > 0 && (
          <span className="filter-count-badge">{filtersCount}</span>
        )}
      </div>
    </button>
  );
}
