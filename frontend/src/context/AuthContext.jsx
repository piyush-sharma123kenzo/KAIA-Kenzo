/**
 * KAIA Technologies — Authentication State Context
 * 
 * Provides:
 *  - User session state & active brand profile
 *  - Reactive login, registration, OTP verification, and logout methods
 *  - Password reset flows and profile updates
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import authApi from '../services/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely access Clerk hooks if ClerkProvider is present
  let clerkUser = null;
  let clerkIsLoaded = true;
  let clerkIsSignedIn = false;
  let clerk = null;

  try {
    const clerkUserHook = useClerkUser();
    clerkUser = clerkUserHook?.user;
    clerkIsLoaded = clerkUserHook?.isLoaded ?? true;
    clerkIsSignedIn = clerkUserHook?.isSignedIn ?? false;
    clerk = useClerk();
  } catch (e) {
    // ClerkProvider might not be active if key is not configured
  }

  const syncedClerkIdRef = useRef(null);

  // Synchronize Clerk user state with KAIA backend session
  useEffect(() => {
    if (!clerkIsLoaded) return;

    if (clerkIsSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const clerkId = clerkUser.id;

      if (syncedClerkIdRef.current !== clerkId && email) {
        syncedClerkIdRef.current = clerkId;
        const storedRole = sessionStorage.getItem('kaia_auth_intent_role') || 'USER';
        sessionStorage.removeItem('kaia_auth_intent_role');

        authApi.clerkAuth({
          clerkId,
          email,
          name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
          avatar: clerkUser.imageUrl,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: storedRole,
        }).then(async (res) => {
          if (res?.success && res?.user) {
            if (res.token) {
              localStorage.setItem('kaia_token', res.token);
            }
            setUser(res.user);
            const meRes = await authApi.getCurrentUser().catch(() => ({}));
            if (meRes.success) {
              setBrand(meRes.brand);
            }
          }
        }).catch((err) => {
          console.warn('[Clerk Auth Sync Error]:', err.message);
        });
      }
    } else if (!clerkIsSignedIn && syncedClerkIdRef.current) {
      syncedClerkIdRef.current = null;
    }
  }, [clerkIsLoaded, clerkIsSignedIn, clerkUser]);

  // Restore authenticated session on application mount
  const loadUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        setUser(response.user);
        setBrand(response.brand);
      }
    } catch (err) {
      setUser(null);
      setBrand(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login handler
  const login = async (email, password, role = null) => {
    setError(null);
    try {
      const res = await authApi.loginUser({ email, password, role });
      if (res.success) {
        if (res.token) {
          localStorage.setItem('kaia_token', res.token);
        }
        setUser(res.user);
        // Refresh session to fetch associated brand partner profile if any
        const meRes = await authApi.getCurrentUser().catch(() => ({}));
        if (meRes.success) {
          setBrand(meRes.brand);
        }
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const requiresVerification = err.response?.data?.requiresVerification;
      const emailVal = err.response?.data?.email;
      setError(errMsg);
      const authError = new Error(errMsg);
      authError.requiresVerification = requiresVerification;
      authError.email = emailVal;
      throw authError;
    }
  };

  // Google OAuth Sign In / Sign Up handler
  const googleSignIn = async (googlePayload) => {
    setError(null);
    try {
      const res = await authApi.googleAuth(googlePayload);
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('kaia_token', res.token);
        }
        setUser(res.user);
        const meRes = await authApi.getCurrentUser().catch(() => ({}));
        if (meRes.success) {
          setBrand(meRes.brand);
        }
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Google authentication failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Registration handler
  const register = async (name, email, password, confirmPassword, role = 'CUSTOMER', phone = '') => {
    setError(null);
    try {
      const res = await authApi.registerUser({
        name,
        email,
        password,
        confirmPassword,
        role,
        phone,
      });

      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('kaia_token', res.token);
        }
        setUser(res.user);
      }
      return res;
    } catch (err) {
      const data = err.response?.data || {};
      const errMsg = data.message || 'Registration failed.';
      setError(errMsg);
      const regError = new Error(errMsg);
      regError.statusCode = err.response?.status;
      regError.isVerified = data.isVerified;
      regError.requiresVerification = data.requiresVerification;
      regError.code = data.code;
      regError.email = data.email || email;
      throw regError;
    }
  };

  // Verify OTP handler
  const verifyOtp = async (email, otp, purpose) => {
    setError(null);
    try {
      const res = await authApi.verifyEmailOtp({ email, otp, purpose });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('kaia_token', res.token);
        }
        setUser(res.user);
      }
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'OTP verification failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Resend OTP handler
  const resendOtp = async (email, purpose) => {
    setError(null);
    try {
      return await authApi.resendEmailOtp({ email, purpose });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Forgot Password handler
  const forgotPassword = async (email) => {
    setError(null);
    try {
      return await authApi.forgotPassword(email);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to process password reset request.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password handler
  const resetPassword = async (email, resetToken, newPassword, confirmPassword) => {
    setError(null);
    try {
      return await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Password reset failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      if (clerk?.signOut) {
        await clerk.signOut().catch(() => {});
      }
      await authApi.logoutUser();
    } catch (err) {
      console.error('[KAIA Auth] Logout error:', err.message);
    } finally {
      setUser(null);
      setBrand(null);
      localStorage.removeItem('kaia_token');
      localStorage.removeItem('cart');
    }
  };

  // Update user avatar in local state reactively
  const updateUserAvatar = (updatedUserOrAvatar) => {
    if (!updatedUserOrAvatar) return;
    if (typeof updatedUserOrAvatar === 'object') {
      setUser((prev) => {
        if (!prev) return prev;
        const newProfileImage = updatedUserOrAvatar.profileImage || {
          url: updatedUserOrAvatar.avatar || '',
          publicId: '',
          updatedAt: new Date(),
        };
        return {
          ...prev,
          ...updatedUserOrAvatar,
          avatar: updatedUserOrAvatar.avatar || newProfileImage.url || '',
          profileImage: newProfileImage,
        };
      });
    } else if (typeof updatedUserOrAvatar === 'string') {
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          avatar: updatedUserOrAvatar,
          profileImage: {
            url: updatedUserOrAvatar,
            publicId: '',
            updatedAt: new Date(),
          },
        };
      });
    }
  };

  // Update personal profile
  const updateProfile = async (updates) => {
    setError(null);
    try {
      if (!updates) return;
      // If full user object passed from avatar upload or userApi
      if (updates._id && (updates.email || updates.name)) {
        setUser((prev) => ({ ...prev, ...updates }));
        return { success: true, user: updates };
      }
      if (updates.avatar !== undefined || updates.profileImage !== undefined) {
        updateUserAvatar(updates);
      }
      const payload = typeof updates === 'object' ? updates : { name: arguments[0], phone: arguments[1], gstin: arguments[2] };
      const res = await authApi.updateUserProfile(payload);
      if (res.success && res.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Profile update failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        brand,
        loading,
        error,
        login,
        googleSignIn,
        register,
        logout,
        updateProfile,
        updateUserAvatar,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        clearError,
        reloadSession: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || {};
};

export default AuthProvider;
