/**
 * KAIA Technologies — ViewModeSwitch Component
 * 
 * Ultra-premium, tactile, realistic Apple-inspired Grid vs List view toggle pill switch.
 * Features:
 *  - Custom 3x3 grid & 3-bar list icons matching native design
 *  - Tactile white active pill with soft ambient depth shadow
 *  - Smooth fluid transitions and keyboard accessibility
 *  - Optional persistence with localStorage
 */

import React from 'react';

export const ViewModeSwitch = ({
  viewMode = 'grid', // 'grid' | 'list'
  onChange = () => {},
  size = 'md', // 'sm' | 'md'
  className = '',
}) => {
  const isGrid = viewMode === 'grid';
  const isList = viewMode === 'list';

  const sizeClasses = {
    sm: {
      pill: 'p-1 gap-1 rounded-xl',
      btn: 'w-7 h-7 rounded-lg',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      pill: 'p-1.5 gap-1.5 rounded-2xl',
      btn: 'w-8 h-8 rounded-xl',
      icon: 'w-4 h-4',
    },
  }[size] || {
    pill: 'p-1.5 gap-1.5 rounded-2xl',
    btn: 'w-8 h-8 rounded-xl',
    icon: 'w-4 h-4',
  };

  return (
    <div
      role="group"
      aria-label="View mode selector"
      className={`inline-flex items-center bg-[#F1F5F9]/90 border border-slate-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] select-none transition-all ${sizeClasses.pill} ${className}`}
    >
      {/* 1. Grid View Button */}
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-pressed={isGrid}
        aria-label="Grid View"
        title="Grid View (3-4 Columns)"
        className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
          sizeClasses.btn
        } ${
          isGrid
            ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-100 scale-100'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
        } active:scale-90`}
      >
        {/* Custom Crisp 3x3 Grid Icon */}
        <svg
          className={sizeClasses.icon}
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1.5" y="1.5" width="3.5" height="3.5" rx="1" />
          <rect x="6.25" y="1.5" width="3.5" height="3.5" rx="1" />
          <rect x="11" y="1.5" width="3.5" height="3.5" rx="1" />
          <rect x="1.5" y="6.25" width="3.5" height="3.5" rx="1" />
          <rect x="6.25" y="6.25" width="3.5" height="3.5" rx="1" />
          <rect x="11" y="6.25" width="3.5" height="3.5" rx="1" />
          <rect x="1.5" y="11" width="3.5" height="3.5" rx="1" />
          <rect x="6.25" y="11" width="3.5" height="3.5" rx="1" />
          <rect x="11" y="11" width="3.5" height="3.5" rx="1" />
        </svg>
      </button>

      {/* 2. List View Button */}
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={isList}
        aria-label="List View"
        title="List View (Detailed Rows)"
        className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
          sizeClasses.btn
        } ${
          isList
            ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-100 scale-100'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
        } active:scale-90`}
      >
        {/* Custom Crisp 3-Row List Icon */}
        <svg
          className={sizeClasses.icon}
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="2.5" cy="3.5" r="1.25" />
          <rect x="5.5" y="2.25" width="9" height="2.5" rx="1.25" />
          <circle cx="2.5" cy="8" r="1.25" />
          <rect x="5.5" y="6.75" width="9" height="2.5" rx="1.25" />
          <circle cx="2.5" cy="12.5" r="1.25" />
          <rect x="5.5" y="11.25" width="9" height="2.5" rx="1.25" />
        </svg>
      </button>
    </div>
  );
};

export default ViewModeSwitch;
