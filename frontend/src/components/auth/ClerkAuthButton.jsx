import React, { useState, useContext } from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const ClerkLogoIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const ClerkSignedInCard = ({ role, onAuthIntent }) => {
  const { user: clerkUser } = useUser();
  const { syncClerkSession } = useContext(AuthContext) || {};
  const { openSignIn } = useClerk() || {};
  const [loggingIn, setLoggingIn] = useState(false);

  const displayName = clerkUser?.fullName || clerkUser?.firstName || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';

  const handleContinue = async () => {
    if (onAuthIntent) onAuthIntent();
    if (syncClerkSession && clerkUser) {
      setLoggingIn(true);
      try {
        await syncClerkSession(clerkUser, true);
      } finally {
        setLoggingIn(false);
      }
    }
  };

  const handleSwitchAccount = (e) => {
    e.stopPropagation();
    if (openSignIn) {
      openSignIn();
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleContinue}
        disabled={loggingIn}
        className="w-full flex items-center justify-between p-2.5 px-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 text-purple-950 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left group disabled:opacity-60"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {clerkUser?.imageUrl ? (
            <img
              src={clerkUser.imageUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover border border-purple-300 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              Continue as {displayName}
            </p>
            <p className="text-[10px] text-purple-700 truncate">
              {clerkUser?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 pl-2 text-purple-700 group-hover:text-purple-900 group-hover:translate-x-0.5 transition-all shrink-0">
          {loggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="text-xs font-bold hidden sm:inline">Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </div>
      </button>

      <div className="flex justify-between items-center px-1 text-[11px]">
        <span className="text-slate-400">Signed in via Clerk</span>
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
        >
          Switch account
        </button>
      </div>
    </div>
  );
};

const ClerkAuthButton = ({ mode = 'signIn', text, role = 'USER', className = '' }) => {
  const isPublishableKeySet = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!isPublishableKeySet) {
    return null;
  }

  const normalizedRole = (role || 'USER').toUpperCase();

  const defaultText = mode === 'signUp'
    ? 'Sign up with Clerk'
    : 'Sign in with Clerk';

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
        <ClerkSignedInCard role={normalizedRole} onAuthIntent={handleClerkClick} />
      </SignedIn>
    </div>
  );
};

export default ClerkAuthButton;
