import {useState, useEffect} from 'react';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import { useAside } from './Aside';

/**
 * @param {{
 *   product: any;
 *   isOpen: boolean;
 *   onClose: () => void;
 * }}
 */
export function QuickAddModal({product, isOpen, onClose}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const {open} = useAside();
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event) => {
      // Check if click is outside any product item
      const productItems = document.querySelectorAll('.product-item');
      const clickedInsideProductItem = Array.from(productItems).some(item => 
        item.contains(event.target)
      );
      
      // Check if click is inside modal
      const modalElement = document.querySelector('.quick-add-modal');
      const clickedInsideModal = modalElement && modalElement.contains(event.target);
      
      // Close modal if clicked outside product items and not inside modal
      if (!clickedInsideProductItem && !clickedInsideModal) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Get the first option (like "Size") from the product
  const firstOption = product.options?.[0];
  const hasVariants = product.variants?.nodes?.length > 1;

  // If no variants or options, use the first/only variant
  const defaultVariant = product.variants?.nodes?.[0];
  const currentVariant = selectedVariant || defaultVariant;

  // Handle option selection
  const handleOptionChange = (optionName, optionValue) => {
    const newSelectedOption = {
      [optionName]: optionValue,
    };

    setSelectedOptions(newSelectedOption);

    // Find the variant that matches the selected options
    const matchingVariant = product.variants?.nodes?.find((variant) =>
      variant.selectedOptions?.some(
        (option) =>
          option.name === optionName && option.value === optionValue
      )
    );

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedVariant(null);
    setSelectedOptions({});
    setIsAddingToCart(false);
    onClose();
  };

  // Handle add to cart with loading state
  const handleAddToCart = async (event) => {
    setIsAddingToCart(true);
    
    // Add a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Open cart drawer
    open("cart");
    await event.target.form.requestSubmit();

    // Close modal after successful add
    handleClose();
  };

  return (
    <div className="quick-add-modal-overlay" onClick={handleClose}>
      <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quick-add-modal-close" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="quick-add-modal-content">
          <div className="quick-add-product-info">
            {product.featuredImage && (
              <img
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                className="quick-add-product-image"
              />
            )}
            <div className="quick-add-product-details">
              <h3>{product.title}</h3>
              <div className="quick-add-price">
                <Money data={currentVariant?.price || product.priceRange.minVariantPrice} />
              </div>
            </div>
          </div>

          {/* Show variant options only if there are multiple variants */}
          {hasVariants && firstOption && (
            <div className="quick-add-options">
              <label className="quick-add-option-label">
                {firstOption.name}:
              </label>
              <div className="quick-add-option-values">
                {firstOption.optionValues?.map((optionValue) => {
                  const isSelected = selectedOptions[firstOption.name] === optionValue.name;
                  const variant = optionValue.firstSelectableVariant;
                  const isAvailable = variant?.availableForSale;
                  
                  return (
                    <button
                      key={optionValue.name}
                      className={`quick-add-option-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
                      onClick={() => handleOptionChange(firstOption.name, optionValue.name)}
                      disabled={!isAvailable}
                    >
                      {optionValue.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="quick-add-actions">
            <AddToCartButton
              disabled={!currentVariant?.availableForSale || isAddingToCart}
              lines={currentVariant ? [
                {
                  merchandiseId: currentVariant.id,
                  quantity: 1,
                }
              ] : []}
              onClick={(e) =>handleAddToCart(e)}
            >
              {isAddingToCart ? (
                <div className="loading-button-content">
                  <div className="loading-spinner"></div>
                  Adding...
                </div>
              ) : (
                currentVariant?.availableForSale ? 'Add to Cart' : 'Sold Out'
              )}
            </AddToCartButton>
          </div>
        </div>
      </div>
    </div>
  );
}
