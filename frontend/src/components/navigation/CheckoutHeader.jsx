import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, PhoneCall } from 'lucide-react';

const CheckoutHeader = () => {
  return (
    <header className="w-full bg-slate-950 text-white border-b border-slate-850 py-3.5 px-4 md:px-8 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo & Return to Cart */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-baseline space-x-1.5 group">
            <span className="text-xl md:text-2xl font-black tracking-tight text-white leading-none">
              KAIA
            </span>
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">
              Technologies
            </span>
          </Link>

          <Link
            to="/cart"
            className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cart</span>
          </Link>
        </div>

        {/* Center: Step Indicator */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
            <span>Address & Shipping</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">2</span>
            <span>Payment Portal</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">3</span>
            <span>Order Confirmation</span>
          </div>
        </div>

        {/* Right: Bank Encryption Trust Badge */}
        <div className="flex items-center space-x-4 text-right text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[11px]">256-Bit SSL Secure</span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default CheckoutHeader;
