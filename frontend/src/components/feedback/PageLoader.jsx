import React from 'react';

const PageLoader = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
        <span className="absolute font-black text-xs text-slate-900 tracking-tighter">K</span>
      </div>
      <div className="text-center space-y-1">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
          KAIA Technologies
        </span>
        <span className="text-[11px] text-slate-400">Loading experience...</span>
      </div>
    </div>
  );
};

export default PageLoader;
