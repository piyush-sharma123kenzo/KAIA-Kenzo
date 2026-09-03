import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * KAIA Technologies — Modern Custom Select Dropdown
 * 
 * High-end customizable dropdown component with smooth animations,
 * custom hover effects, checkmark indicators, and outside-click dismissal.
 */
const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  dropdownClassName = '',
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: TriggerIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to objects { value, label, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label || opt.name || opt.value,
        icon: opt.icon,
      };
    }
    return { value: opt, label: opt };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange(val);
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-3.5 text-xs font-semibold',
    lg: 'py-2.5 px-4 text-sm font-semibold',
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          flex items-center justify-between gap-2.5 bg-white border border-slate-200/90 
          rounded-xl shadow-xs text-slate-800 hover:border-amber-400/80 hover:bg-slate-50/50 
          focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 
          transition-all duration-200 cursor-pointer select-none
          ${sizeClasses[size] || sizeClasses.md}
          ${isOpen ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}
          ${className}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {TriggerIcon && <TriggerIcon className="w-4 h-4 text-slate-400 shrink-0" />}
          {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 text-slate-500 shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-1.5 min-w-[200px] w-max max-w-[280px] bg-white/95 backdrop-blur-md 
            rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-in fade-in 
            zoom-in-95 duration-150 origin-top-right select-none
            ${dropdownClassName}
          `}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 no-scrollbar">
            {normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all duration-150 text-left cursor-pointer
                    ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <opt.icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 shrink-0 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
