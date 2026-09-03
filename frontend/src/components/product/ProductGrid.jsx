import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({
  products = [],
  viewMode = 'grid',
  onQuickView,
  wishlistIds = [],
  onToggleWishlist,
  className = '',
  ...props
}) => {
  const gridClasses =
    viewMode === 'list'
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6';

  return (
    <div className={`${gridClasses} ${className}`} {...props}>
      {products.map((prod, index) => (
        <ProductCard
          key={prod?._id || prod?.id || prod?.slug || `prod-${index}`}
          product={prod}
          viewMode={viewMode}
          isWishlisted={wishlistIds.includes(prod?._id)}
          onToggleWishlist={onToggleWishlist}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
