import React, { useState } from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Sparkles, ShieldCheck, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

const ClerkLogoIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const ClerkAuthButton = ({ mode = 'signIn', text, role = 'USER', className = '' }) => {
  const isPublishableKeySet = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const [showConfigNotice, setShowConfigNotice] = useState(false);

  const normalizedRole = (role || 'USER').toUpperCase();

  const defaultText = mode === 'signUp'
    ? (normalizedRole === 'ADMIN'
        ? 'Sign up with Clerk as Admin'
        : normalizedRole === 'VENDOR' || normalizedRole === 'BRAND'
          ? 'Sign up with Clerk as Vendor'
          : 'Sign up with Clerk')
    : (normalizedRole === 'ADMIN'
        ? 'Sign in with Clerk as Admin'
        : normalizedRole === 'VENDOR' || normalizedRole === 'BRAND'
          ? 'Sign in with Clerk as Vendor'
          : 'Sign in with Clerk');

  const label = text || defaultText;

  const handleClerkClick = () => {
    try {
      sessionStorage.setItem('kaia_auth_intent_role', normalizedRole);
    } catch (e) {
      console.warn('Could not store auth intent role:', e.message);
    }
  };

  if (!isPublishableKeySet) {
    return (
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={() => setShowConfigNotice(!showConfigNotice)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs md:text-sm rounded-lg shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
          title="Clerk configuration key required"
        >
          <div className="flex items-center space-x-2">
            <ClerkLogoIcon />
            <span>{label}</span>
          </div>
          <span className="text-[10px] bg-white/20 text-purple-100 uppercase tracking-widest px-2 py-0.5 rounded font-mono font-bold">
            {normalizedRole === 'ADMIN' ? 'ROOT' : normalizedRole === 'VENDOR' ? 'BRAND' : 'SSO'}
          </span>
        </button>

        {showConfigNotice && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1 text-left animate-in fade-in duration-150">
            <div className="flex items-center space-x-1.5 font-bold text-amber-800">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Clerk Key Setup Required</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Add your publishable key to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">frontend/.env</code> as:
            </p>
            <p className="font-mono text-[10px] bg-white p-1.5 rounded border border-amber-200 text-slate-800 break-all select-all font-bold">
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Button styling based on role
  const buttonTheme = normalizedRole === 'ADMIN'
    ? 'bg-slate-900 hover:bg-slate-850 active:bg-slate-950 border border-purple-500/40'
    : normalizedRole === 'VENDOR' || normalizedRole === 'BRAND'
      ? 'bg-[#6C47FF] hover:bg-[#5835ea] active:bg-[#4927d8]'
      : 'bg-[#6C47FF] hover:bg-[#5835ea] active:bg-[#4927d8]';

  return (
    <div className={`w-full ${className}`}>
      <SignedOut>
        {mode === 'signUp' ? (
          <SignUpButton mode="modal">
            <button
              type="button"
              onClick={handleClerkClick}
              className={`w-full flex items-center justify-between px-4 py-2.5 ${buttonTheme} text-white font-bold text-xs md:text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer`}
            >
              <div className="flex items-center space-x-2.5">
                <ClerkLogoIcon />
                <span>{label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-white">
                  {normalizedRole === 'ADMIN' ? 'ROOT' : normalizedRole === 'VENDOR' ? 'BRAND' : 'BUYER'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </button>
          </SignUpButton>
        ) : (
          <SignInButton mode="modal">
            <button
              type="button"
              onClick={handleClerkClick}
              className={`w-full flex items-center justify-between px-4 py-2.5 ${buttonTheme} text-white font-bold text-xs md:text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer`}
            >
              <div className="flex items-center space-x-2.5">
                <ClerkLogoIcon />
                <span>{label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-white">
                  {normalizedRole === 'ADMIN' ? 'ROOT' : normalizedRole === 'VENDOR' ? 'BRAND' : 'BUYER'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </button>
          </SignInButton>
        )}
      </SignedOut>

      <SignedIn>
        <div className="flex items-center justify-between p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl">
          <div className="flex items-center space-x-3">
            <UserButton />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>Authenticated with Clerk</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </p>
              <p className="text-[11px] text-slate-500">
                Active role: <span className="font-bold text-indigo-700">{normalizedRole}</span>
              </p>
            </div>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default ClerkAuthButton;

