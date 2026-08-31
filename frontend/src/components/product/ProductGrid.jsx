import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({
  products = [],
  onQuickView,
  wishlistIds = [],
  onToggleWishlist,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
      {...props}
    >
      {products.map((prod, index) => (
        <ProductCard
          key={prod?._id || prod?.id || prod?.slug || `prod-${index}`}
          product={prod}
          isWishlisted={wishlistIds.includes(prod?._id)}
          onToggleWishlist={onToggleWishlist}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
