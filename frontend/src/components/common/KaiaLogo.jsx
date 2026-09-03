import React from 'react';
import { Link } from 'react-router-dom';
import KaiaIcon from './KaiaIcon';

/**
 * KaiaLogo — Complete Brand Identity Component for KAIA Technologies
 * 
 * Props:
 * - variant: 'horizontal' | 'full' | 'stacked' | 'compact' | 'icon-only'
 * - theme: 'dark' (default for dark navbar/headers) | 'light' (for light cards/invoices)
 * - size: 'sm' | 'md' | 'lg' | 'xl'
 * - showTagline: boolean (default true for 'full' variant)
 * - to: string (if provided, wraps in Link component)
 * - className: additional wrapper classes
 * - animated: enable circuit pulse animations
 */
export const KaiaLogo = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  showTagline = true,
  to,
  className = '',
  animated = false
}) => {
  const isLight = theme === 'light';
  
  // Sizing matrix
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 46,
    xl: 60
  };

  const currentIconSize = iconSizes[size] || 36;

  // Typography color classes
  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const subtextColor = isLight ? 'text-slate-500' : 'text-slate-400';
  const taglineColor = isLight ? 'text-slate-700' : 'text-slate-300';
  const dividerColor = '#F59E0B';

  const logoContent = (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className={`flex items-center ${variant === 'stacked' ? 'flex-col space-y-2 text-center' : 'flex-row space-x-3 text-left'}`}>
        
        {/* Emblem */}
        <KaiaIcon 
          size={currentIconSize} 
          variant={theme} 
          animated={animated}
        />

        {/* Wordmark */}
        {variant !== 'icon-only' && (
          <div className="flex flex-col justify-center">
            {/* KAIA Main Brand Typography */}
            <div className="flex items-center space-x-0.5 leading-none">
              {/* K */}
              <span className={`font-black tracking-tight ${textColor} ${
                size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-4xl' : 'text-2xl'
              }`}>
                K
              </span>

              {/* Delta 'A' with Glowing Amber Pyramid */}
              <div className="relative inline-flex items-center justify-center">
                <svg
                  className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : size === 'xl' ? 'w-9 h-9' : 'w-5 h-5'}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  {/* Outer Delta Stroke */}
                  <path
                    d="M12 2L2 22H22L12 2Z"
                    stroke={isLight ? '#0F172A' : '#FFFFFF'}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* Inner Glowing Amber Triangle */}
                  <path
                    d="M12 11L7 20H17L12 11Z"
                    fill="url(#kaia-a-gold)"
                  />
                  <defs>
                    <linearGradient id="kaia-a-gold" x1="12" y1="11" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* I */}
              <span className={`font-black tracking-tight ${textColor} ${
                size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : size === 'xl' ? 'text-4xl' : 'text-2xl'
              }`}>
                I
              </span>

              {/* Delta 'A' (Second) */}
              <div className="relative inline-flex items-center justify-center">
                <svg
                  className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : size === 'xl' ? 'w-9 h-9' : 'w-5 h-5'}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2L2 22H22L12 2Z"
                    stroke={isLight ? '#0F172A' : '#FFFFFF'}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 11L7 20H17L12 11Z"
                    fill="url(#kaia-a-gold)"
                  />
                </svg>
              </div>
            </div>

            {/* TECHNOLOGIES Sub-line */}
            <span className={`font-bold tracking-[0.25em] uppercase block leading-none ${subtextColor} ${
              size === 'sm' ? 'text-[7.5px] mt-0.5' : size === 'lg' ? 'text-[11px] mt-1' : size === 'xl' ? 'text-[13px] mt-1.5' : 'text-[9px] mt-0.5'
            }`}>
              TECHNOLOGIES
            </span>
          </div>
        )}
      </div>

      {/* Tagline Strip: POWERING PERFORMANCE. DELIVERING TRUST. */}
      {(variant === 'full' || (variant === 'stacked' && showTagline)) && (
        <div className="flex items-center justify-center space-x-2 mt-2.5 pt-1.5 border-t border-slate-800/40">
          <div className="h-[1.5px] w-6 bg-gradient-to-r from-transparent to-amber-500" />
          <span className={`text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider whitespace-nowrap ${taglineColor}`}>
            POWERING PERFORMANCE. DELIVERING TRUST.
          </span>
          <div className="h-[1.5px] w-6 bg-gradient-to-l from-transparent to-amber-500" />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block group focus:outline-none" title="KAIA Technologies">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default KaiaLogo;
