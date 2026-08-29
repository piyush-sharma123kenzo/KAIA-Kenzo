import React from 'react';

const Badge = ({
  variant = 'new',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider select-none border';

  const variants = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    best_seller: 'bg-amber-50 text-amber-700 border-amber-200',
    deal: 'bg-red-50 text-red-700 border-red-200',
    limited: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
    out_of_stock: 'bg-brand-gray-100 text-brand-gray-500 border-brand-gray-250',
    verified: 'bg-green-50 text-green-700 border-green-200',
    featured: 'bg-brand-accent/5 text-brand-accent border-brand-accent/20',
  };

  const labelText = {
    new: 'New',
    best_seller: 'Best Seller',
    deal: 'Deal',
    limited: 'Limited Stock',
    out_of_stock: 'Out of Stock',
    verified: 'Verified Partner',
    featured: 'Featured',
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children || labelText[variant]}
    </span>
  );
};

export default Badge;
