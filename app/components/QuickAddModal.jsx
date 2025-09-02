import {useState, useEffect} from 'react';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {useQuickAdd} from './QuickAddProvider';

/**
 * @param {{
 *   product: any;
 *   isOpen: boolean;
 *   onClose: () => void;
 * }}
 */
export function QuickAddModal({product, isOpen, onClose}) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const {isMobile} = useQuickAdd();
  const {open} = useAside();
  
  /**
   * Auto-selects the first available option for each variant when modal opens
   * Sets up default selected options and finds matching variant
   */
  useEffect(() => {
    if (isOpen && product && product.options) {
      const defaultOptions = product.options
        .map((option) => {
          const firstAvailableOption = option.optionValues?.find(
            (val) => val.firstSelectableVariant.availableForSale,
          );
          return {
            name: option.name,
            value: firstAvailableOption
              ? firstAvailableOption.name
              : option.optionValues?.[0]?.name,
          };
        })
        .filter((option) => option.value); // Filter out any undefined values

      setSelectedVariantOptions(defaultOptions);

      // Find the variant that matches these default options
      const matchingVariant = getMatchedVariant(defaultOptions);

      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
      }
    }
  }, [isOpen, product]);

  /**
   * Handles ESC key press and click outside modal to close it
   * Sets up event listeners for keyboard and mouse interactions
   */
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event) => {
      // Check if click is outside any product item
      const productItems = document.querySelectorAll('.product-item');
      const clickedInsideProductItem = Array.from(productItems).some((item) =>
        item.contains(event.target),
      );

      // Check if click is inside modal
      const modalElement = document.querySelector('.quick-add-modal');
      const clickedInsideModal =
        modalElement && modalElement.contains(event.target);

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
  const hasVariants = product.variants?.nodes?.length > 1;
  const currentVariant = selectedVariant;

  /**
   * Handles option selection for product variants
   * Updates selected options and finds matching variant
   * @param {string} optionName - The name of the option (e.g., "Size", "Color")
   * @param {string} optionValue - The value of the option (e.g., "Large", "Red")
   * @param {boolean} isChecked - Whether the option is selected/checked
   */
  const handleOptionChange = (optionName, optionValue, isChecked) => {
    let updatedSelectedVariantOptions;
    if (isChecked) {
      // Remove any existing option with the same name, then add the new one
      const filteredOptions = selectedVariantOptions.filter(
        (option) => option.name !== optionName,
      );
      updatedSelectedVariantOptions = [
        ...filteredOptions,
        {name: optionName, value: optionValue},
      ];

      // Sort the options to match the order in product.options
      updatedSelectedVariantOptions = updatedSelectedVariantOptions.sort(
        (a, b) => {
          const aIndex =
            product.options?.findIndex((opt) => opt.name === a.name) ?? -1;
          const bIndex =
            product.options?.findIndex((opt) => opt.name === b.name) ?? -1;
          return aIndex - bIndex;
        },
      );

      setSelectedVariantOptions(updatedSelectedVariantOptions);
    } else {
      // Remove the option when unchecked
      updatedSelectedVariantOptions = selectedVariantOptions.filter(
        (option) => option.name !== optionName || option.value !== optionValue,
      );
      setSelectedVariantOptions(updatedSelectedVariantOptions);
    }

    // Find the variant that matches ALL selected options
    const matchingVariant = getMatchedVariant(updatedSelectedVariantOptions);
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  /**
   * Finds a variant that matches the selected options
   * Compares variant's selectedOptions with user's selected options in order
   * @param {Array<{name: string, value: string}>} options - Array of selected option objects
   * @returns {Object|undefined} The matching variant object or undefined if not found
   */
  const getMatchedVariant = (options) => {
    return product.variants?.nodes?.find((variant) =>
      variant.selectedOptions?.every(
        (selectedOption, idx) =>
          selectedOption.name === options[idx].name &&
          selectedOption.value === options[idx].value,
      ),
    );
  };

  /**
   * Resets all modal state and closes the modal
   * Clears selected variant, options, and loading state
   * Also resets mobile product button opacity if applicable
   */
  const handleClose = () => {
    setSelectedVariant(null);
    setSelectedVariantOptions([]);
    setIsAddingToCart(false);
    onClose();
    if (!isMobile) return;
    document.querySelector(
      `.product-item[data-product-id="${product.id}"] .quick-add-btn`,
    ).style.opacity = 1;
  };

  /**
   * Handles adding the current variant to cart with loading state
   * Submits the form, shows loading state, closes modal, and opens cart
   * @param {Event} event - The click event from the add to cart button
   */
  const handleAddToCart = async (event) => {
    setIsAddingToCart(true);
    await event.target.form.requestSubmit();
    // Add a small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await handleClose();
    await open('cart');
  };

  /**
   * Filters product options to only include those with multiple values
   * where all option values belong to the same product handle
   * Used to determine which option groups should be displayed
   * @type {Array<Object>} Filtered array of product option objects
   */
  const productOptions = product?.options?.filter(
    (op) =>
      op.optionValues?.length > 1 &&
      op.optionValues.every((option, idx) => {
        const currentVariant = option.firstSelectableVariant;
        const nextOption = op.optionValues[idx + 1];
        if (
          !nextOption ||
          !currentVariant ||
          !nextOption.firstSelectableVariant
        )
          return true;
        return (
          currentVariant.product?.handle ===
          nextOption.firstSelectableVariant.product?.handle
        );
      }),
  );

  return (
    <div className="quick-add-modal-overlay" onClick={handleClose}>
      <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <button className="quick-add-modal-close" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
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
                <Money
                  data={
                    currentVariant?.price || product.priceRange.minVariantPrice
                  }
                />
              </div>
            </div>
          </div>

          {/* Show variant options only if there are multiple variants */}
          {hasVariants && productOptions && (
            <div>
              {productOptions.map((op) => (
                <div key={op.name} className="quick-add-options">
                  <div className="quick-add-option-label">{op.name}:</div>
                  <div className="quick-add-option-values">
                    {op.optionValues?.map((optionValue, idx) => {
                      const variant = optionValue.firstSelectableVariant;
                      const isAvailable = variant?.availableForSale;
                      const inputId = `${op.name}-${optionValue.name}`;

                      // Check if this option is currently selected
                      const isSelected = selectedVariantOptions.some(
                        (selectedOption) =>
                          optionValue.firstSelectableVariant.availableForSale &&
                          selectedOption.name === op.name &&
                          selectedOption.value === optionValue.name,
                      );

                      return (
                        <div key={optionValue.name} className="radio-option">
                          <input
                            type="radio"
                            name={`variant-option-${op.name}`}
                            id={inputId}
                            className={`quick-add-option-input ${!isAvailable ? 'unavailable' : ''}`}
                            checked={isSelected}
                            onChange={(e) =>
                              handleOptionChange(
                                op.name,
                                optionValue.name,
                                e.target.checked,
                              )
                            }
                            disabled={!isAvailable}
                          />
                          <label
                            htmlFor={inputId}
                            className={`quick-add-option-btn ${!isAvailable ? 'unavailable' : ''}`}
                          >
                            {optionValue.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="quick-add-actions">
            <AddToCartButton
              disabled={!currentVariant?.availableForSale || isAddingToCart}
              lines={
                currentVariant
                  ? [
                      {
                        merchandiseId: currentVariant.id,
                        quantity: 1,
                      },
                    ]
                  : []
              }
              onClick={(e) => handleAddToCart(e)}
            >
              {isAddingToCart ? (
                <div className="loading-button-content">
                  <div className="loading-spinner"></div>
                  Adding...
                </div>
              ) : currentVariant?.availableForSale ? (
                'Add to Cart'
              ) : (
                'Sold Out'
              )}
            </AddToCartButton>
          </div>
        </div>
      </div>
    </div>
  );
}
