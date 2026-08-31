import React from 'react';
import { Link } from 'react-router-dom';
import { getAccurateProductImage } from '../../utils/productImageMap';

const ProductCard = ({
  product,
  className = '',
  ...props
}) => {
  if (!product) return null;

  const _id = product._id || product.id || '';
  const name = product.name || 'Electronics Product';
  const slug = product.slug || _id || '';
  const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
  const imageUrl = getAccurateProductImage(product);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(sellingPrice);

  return (
    <Link
      to={`/product/${slug}`}
      className={`bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200 group text-left ${className}`}
      {...props}
    >
      <div>
        {/* Fixed Uniform Image Container */}
        <div className="product-image-container border border-slate-100 group-hover:border-amber-400/40 group-hover:shadow-xs transition-all mb-3">
          <img
            src={imageUrl}
            alt={name}
            className="group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Product Name */}
        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
          {name}
        </h3>
      </div>

      {/* Current Price Only */}
      <div className="mt-3 pt-2">
        <span className="text-base font-extrabold text-slate-950 block tracking-tight">
          {formattedPrice}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
