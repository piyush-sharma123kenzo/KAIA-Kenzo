import React from 'react';

/**
 * KaiaIcon — Scalable Vector Emblem of KAIA Technologies
 * Features:
 * - PCB circuit traces with solder nodes along the vertical stem
 * - Cyber amber/gold gradient on the top-right diagonal arm
 * - Obsidian charcoal base and lower leg
 * - Supports animated pulses and responsive sizing
 */
export const KaiaIcon = ({ 
  size = 36, 
  className = '', 
  animated = false,
  glow = false,
  variant = 'dark' // 'dark' (for dark backdrops) | 'light' (for light backdrops)
}) => {
  const gradientId = `kaia-gold-grad-${Math.random().toString(36).substr(2, 9)}`;
  const circuitId = `kaia-circuit-grad-${Math.random().toString(36).substr(2, 9)}`;
  const filterId = `kaia-glow-${Math.random().toString(36).substr(2, 9)}`;

  const isLight = variant === 'light';
  const mainColor = isLight ? '#0F172A' : '#FFFFFF';
  const stemColor = isLight ? '#1E293B' : '#0B0F19';
  const circuitColor = isLight ? '#F59E0B' : '#FBBF24';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Amber / Gold Metallic Gradient */}
        <linearGradient id={gradientId} x1="35" y1="10" x2="110" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Circuit Glow Gradient */}
        <linearGradient id={circuitId} x1="15" y1="95" x2="45" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {glow && (
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Group Container with optional glow */}
      <g filter={glow ? `url(#${filterId})` : undefined}>
        
        {/* 1. Left Vertical Pillar (Matte Obsidian) */}
        <path
          d="M18 12 H42 V108 H18 Z"
          fill={stemColor}
          rx="2"
        />

        {/* 2. Top-Right Diagonal Arm (Vibrant Amber / Gold) */}
        <path
          d="M44 48 L76 12 H106 L62 60 H44 Z"
          fill={`url(#${gradientId})`}
        />

        {/* 3. Bottom-Right Diagonal Leg (Solid Obsidian) */}
        <path
          d="M56 54 L106 108 H74 L42 72 V54 H56 Z"
          fill={stemColor}
        />

        {/* 4. PCB Circuit Traces & Nodes inside the vertical pillar */}
        {/* Circuit Trace 1 (Long outer line) */}
        <path
          d="M26 100 V64 L36 54 V42"
          stroke={circuitColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? "animate-pulse" : ""}
        />
        {/* Circuit Node 1 */}
        <circle cx="26" cy="100" r="3.2" fill={circuitColor} />
        <circle cx="26" cy="100" r="1.5" fill={stemColor} />
        <circle cx="36" cy="42" r="2.2" fill={circuitColor} />

        {/* Circuit Trace 2 (Inner branch) */}
        <path
          d="M34 94 V76 L28 70 V62"
          stroke={circuitColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? "animate-pulse" : ""}
          style={{ animationDelay: '300ms' }}
        />
        {/* Circuit Node 2 */}
        <circle cx="34" cy="94" r="2.5" fill={circuitColor} />
        <circle cx="28" cy="62" r="2" fill={circuitColor} />

        {/* Circuit Trace 3 (Accent dot) */}
        <circle cx="25" cy="46" r="1.8" fill={circuitColor} />
        <line x1="25" y1="46" x2="25" y2="36" stroke={circuitColor} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="25" cy="36" r="1.8" fill={circuitColor} />

        {/* Micro subtle highlight on the amber arm */}
        <path
          d="M78 14 L104 14 L64 58"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default KaiaIcon;
