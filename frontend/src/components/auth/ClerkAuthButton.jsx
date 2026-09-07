import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

const ClerkLogoIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const ClerkAuthButton = ({ mode = 'signIn', text, className = '' }) => {
  const isPublishableKeySet = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!isPublishableKeySet) {
    return null;
  }

  const defaultText = mode === 'signUp' ? 'Sign up with Clerk' : 'Sign in with Clerk';
  const label = text || defaultText;

  return (
    <div className={`w-full ${className}`}>
      <SignedOut>
        {mode === 'signUp' ? (
          <SignUpButton mode="modal">
            <button
              type="button"
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-[#6C47FF] hover:bg-[#5835ea] active:bg-[#4927d8] text-white font-bold text-xs md:text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <ClerkLogoIcon />
              <span>{label}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </SignUpButton>
        ) : (
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-[#6C47FF] hover:bg-[#5835ea] active:bg-[#4927d8] text-white font-bold text-xs md:text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <ClerkLogoIcon />
              <span>{label}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
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
              <p className="text-[11px] text-slate-500">Your session is active</p>
            </div>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default ClerkAuthButton;
