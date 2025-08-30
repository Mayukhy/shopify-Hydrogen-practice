import {Suspense} from 'react';
import {Await} from 'react-router';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation, Pagination} from 'swiper/modules';
import {ProductItem} from './ProductItem';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Shared Swiper configuration
const SWIPER_CONFIG = {
  modules: [Navigation, Pagination],
  spaceBetween: 20,
  slidesPerView: 1,
  navigation: {
    nextEl: '.swiper-button-next-custom',
    prevEl: '.swiper-button-prev-custom',
  },
  pagination: { clickable: true },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 4,
      spaceBetween: 30,
    },
  },
};

// Shared navigation buttons component
const NavigationButtons = () => (
  <>
    <div className="swiper-button-prev-custom">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <div className="swiper-button-next-custom">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  </>
);

export default function RelatedProducts({product, relatedProducts}) {
  return (
    <div className="related-products">
      <h3>Related Products</h3>
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <Await resolve={relatedProducts}>
          {(resolvedRelatedProducts) => (
            <RelatedProductsContent 
              product={product} 
              relatedProducts={resolvedRelatedProducts} 
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function RelatedProductsContent({product, relatedProducts}) {
  if (!relatedProducts?.products?.nodes?.length) {
    return null;
  }

  // Filter out the current product from related products
  const filteredProducts = relatedProducts.products.nodes.filter(
    (relatedProduct) => relatedProduct.id !== product.id
  );

  if (!filteredProducts.length) {
    return null;
  }

  return (
    <div className="related-products-swiper">
      <Swiper
      aria-label='Related products carousel'
      {...SWIPER_CONFIG}>
        {filteredProducts.map((relatedProduct) => (
          <SwiperSlide key={relatedProduct.id}>
            <ProductItem
              product={relatedProduct}
              loading="lazy"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <NavigationButtons />
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="related-products-swiper">
      <Swiper
      aria-label='Related products carousel'
      {...SWIPER_CONFIG}>
        {[...Array(4)].map((_, i) => (
          <SwiperSlide key={i}>
            <div className="product-item-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-price"></div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <NavigationButtons />
    </div>
  );
}
