import React, { useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';

// Form design tokens class mapping
const baseInputStyle = 'w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs text-brand-gray-800 transition-all focus:border-brand-accent focus:ring-1 focus:ring-brand-accent focus:bg-white disabled:opacity-50 disabled:bg-brand-gray-50 disabled:cursor-not-allowed';
const errorInputStyle = 'border-red-500 focus:border-red-500 focus:ring-red-500';
const labelStyle = 'block text-[11px] font-bold text-brand-gray-655 uppercase tracking-wider mb-1.5';
const errorMsgStyle = 'text-[10px] font-semibold text-red-500 mt-1';

// Standard Text Input
export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor={inputId} className={labelStyle}>{label}</label>}
      <input
        ref={ref}
        type={type}
        id={inputId}
        className={`${baseInputStyle} ${error ? errorInputStyle : ''}`}
        {...props}
      />
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// Textarea Input
export const Textarea = React.forwardRef(({
  label,
  error,
  rows = 4,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor={inputId} className={labelStyle}>{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`${baseInputStyle} ${error ? errorInputStyle : ''}`}
        {...props}
      />
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

// Select Dropdown
export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  children,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor={inputId} className={labelStyle}>{label}</label>}
      <select
        ref={ref}
        id={inputId}
        className={`${baseInputStyle} cursor-pointer ${error ? errorInputStyle : ''}`}
        {...props}
      >
        {children || options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';

// Checkbox Input
export const Checkbox = React.forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={inputId} className="flex items-center space-x-2.5 cursor-pointer text-xs text-brand-gray-700 select-none">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className="rounded border-brand-gray-300 text-brand-accent focus:ring-brand-accent w-4 h-4"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
Checkbox.displayName = 'Checkbox';

// Radio Button Input
export const Radio = React.forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `radio-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={inputId} className="flex items-center space-x-2.5 cursor-pointer text-xs text-brand-gray-700 select-none">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className="text-brand-accent focus:ring-brand-accent w-4.5 h-4.5"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
Radio.displayName = 'Radio';

// Secure Password Input
export const PasswordInput = React.forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `password-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor={inputId} className={labelStyle}>{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          id={inputId}
          className={`${baseInputStyle} pr-10 ${error ? errorInputStyle : ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-3.5 text-brand-gray-450 hover:text-brand-gray-700 focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

// Number Input
export const NumberInput = React.forwardRef(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `number-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <div className={`w-full ${className}`}>
      {label && <label htmlFor={inputId} className={labelStyle}>{label}</label>}
      <input
        ref={ref}
        type="number"
        id={inputId}
        className={`${baseInputStyle} ${error ? errorInputStyle : ''}`}
        {...props}
      />
      {error && <p className={errorMsgStyle}>{error}</p>}
    </div>
  );
});
NumberInput.displayName = 'NumberInput';
