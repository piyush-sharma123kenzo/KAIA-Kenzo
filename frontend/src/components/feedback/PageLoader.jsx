import React from 'react';
import KaiaIcon from '../common/KaiaIcon';

const PageLoader = ({ message = 'Loading experience...' }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 select-none animate-fadeIn">
      {/* Animated Glowing Kaia Emblem */}
      <div className="relative flex items-center justify-center">
        {/* Soft glowing ambient aura */}
        <div className="absolute w-20 h-20 bg-amber-500/15 rounded-full blur-xl animate-pulse" />
        
        {/* Circuit Orbit Ring */}
        <div className="w-16 h-16 rounded-full border-2 border-slate-200/80 border-t-amber-500 border-r-amber-500/50 animate-spin" />
        
        {/* Central Authentic KAIA Emblem */}
        <div className="absolute">
          <KaiaIcon 
            size={28} 
            variant="light" 
            animated={true} 
            glow={false}
          />
        </div>
      </div>

      {/* Brand Subtitle & Loading Status */}
      <div className="text-center space-y-1">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-800 block">
          KAIA TECHNOLOGIES
        </span>
        <span className="text-[11px] font-medium text-slate-400 block animate-pulse">
          {message}
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
