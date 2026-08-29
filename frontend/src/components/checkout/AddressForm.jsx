import React from 'react';

const AddressForm = ({ className = '', children, ...props }) => {
  return (
    <div className={`p-4 border rounded-sm bg-white ${className}`} {...props}>
      <span className="text-xs font-bold text-brand-gray-400 uppercase tracking-wider">AddressForm Component</span>
      {children}
    </div>
  );
};

export default AddressForm;
