import React from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const ClerkLogoIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const ClerkSignedInCard = ({ role }) => {
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';

  return (
    <div className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/80 transition-all">
      <div className="flex items-center space-x-3 min-w-0">
        <UserButton afterSignOutUrl="/" />
        <div className="text-left min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
            <span>{displayName}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
        {role === 'ADMIN' ? 'Admin' : role === 'VENDOR' || role === 'BRAND' ? 'Partner' : 'Member'}
      </span>
    </div>
  );
};

const ClerkAuthButton = ({ mode = 'signIn', text, role = 'USER', className = '' }) => {
  const isPublishableKeySet = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!isPublishableKeySet) {
    return null;
  }

  const normalizedRole = (role || 'USER').toUpperCase();

  const defaultText = mode === 'signUp'
    ? 'Continue with Clerk'
    : 'Continue with Clerk';

  const label = text || defaultText;

  const handleClerkClick = () => {
    try {
      sessionStorage.setItem('kaia_auth_intent_role', normalizedRole);
    } catch (e) {
      console.warn('Could not store auth intent role:', e.message);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <SignedOut>
        {mode === 'signUp' ? (
          <SignUpButton mode="modal">
            <button
              type="button"
              onClick={handleClerkClick}
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-4 h-4 text-[#6C47FF] flex items-center justify-center">
                <ClerkLogoIcon />
              </div>
              <span>{label}</span>
            </button>
          </SignUpButton>
        ) : (
          <SignInButton mode="modal">
            <button
              type="button"
              onClick={handleClerkClick}
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="w-4 h-4 text-[#6C47FF] flex items-center justify-center">
                <ClerkLogoIcon />
              </div>
              <span>{label}</span>
            </button>
          </SignInButton>
        )}
      </SignedOut>

      <SignedIn>
        <ClerkSignedInCard role={normalizedRole} />
      </SignedIn>
    </div>
  );
};

export default ClerkAuthButton;
