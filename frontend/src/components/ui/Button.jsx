import React from 'react';

const Button = React.forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  // Base classes with transition and custom focus states for accessibility (AUI)
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-sm transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';
  
  // Custom theme variances
  const variants = {
    primary: 'bg-brand-dark hover:bg-brand-gray-800 text-white border border-brand-dark',
    secondary: 'bg-brand-light hover:bg-brand-gray-100 text-brand-gray-900 border border-brand-gray-200',
    outline: 'bg-transparent hover:bg-brand-gray-50 text-brand-gray-800 border border-brand-gray-300',
    ghost: 'bg-transparent hover:bg-brand-gray-100 text-brand-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border border-green-600',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 space-x-1.5',
    md: 'text-xs px-5 py-2.5 space-x-2',
    lg: 'text-sm px-6 py-3.5 space-x-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
