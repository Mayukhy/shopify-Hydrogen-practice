import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useEffect} from 'react';

/**
 * Modern product slider item component with animations and full-width design
 * @param {{
 *   product: Product;
 *   loading?: HTMLImageElement['loading'];
 * }}
 */
export function ProductSliderItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = variant?.id
    ? `${product.handle}?variant=${variant.id}`
    : product.handle;

  if (!variant) return null;

  return (
    <Link
      className="product-slider-item"
      to={`/products/${variantUrl}`}
      prefetch="intent"
    >
      <div className="product-slider-image-container">
        {product.featuredImage && (
          <Image
            data={product.featuredImage}
            className="product-slider-image"
            loading={loading}
          />
        )}

        {/* <div className="product-slider-overlay">
          <div className="product-slider-content">
            <h3 className="product-slider-title">{product.title}</h3>
            {variant.price && (
              <div className="product-slider-price">
                <Money data={variant.price} />
                {variant.compareAtPrice && (
                  <Money 
                    className="product-slider-compare-price" 
                    data={variant.compareAtPrice} 
                  />
                )}
              </div>
            )}
          </div>
        </div> */}
      </div>
    </Link>
  );
}
