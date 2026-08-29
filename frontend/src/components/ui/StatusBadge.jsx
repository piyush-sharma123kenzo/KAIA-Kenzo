import React from 'react';

const StatusBadge = ({
  status = 'Pending',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider select-none border';

  // Normalize status key
  const key = status.trim().replace(/\s+/g, '_');

  const themes = {
    // Orders
    Pending: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    Processing: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
    Packed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Out_for_Delivery: 'bg-teal-50 text-teal-700 border-teal-200 animate-pulse',
    Delivered: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
    Refunded: 'bg-brand-gray-100 text-brand-gray-500 border-brand-gray-350',

    // Brand Hub Partner approvals
    Brand_Pending: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
    Brand_Approved: 'bg-green-50 text-green-700 border-green-200',
    Brand_Rejected: 'bg-red-50 text-red-700 border-red-200',

    // Payment splits
    Payment_Pending: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
    Payment_Successful: 'bg-green-50 text-green-700 border-green-200',
    Payment_Failed: 'bg-red-50 text-red-700 border-red-200',
  };

  // Fallback
  const activeClass = themes[key] || 'bg-brand-gray-50 text-brand-gray-600 border-brand-gray-200';

  return (
    <span
      className={`${baseStyle} ${activeClass} ${className}`}
      {...props}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
