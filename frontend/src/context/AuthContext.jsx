/**
 * KAIA Technologies — Authentication State Context
 * 
 * Provides:
 *  - User session state & active brand profile
 *  - Reactive login, registration, OTP verification, and logout methods
 *  - Password reset flows and profile updates
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.loginUser({ email, password });
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
      const errMsg = err.response?.data?.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
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

  // Update personal profile
  const updateProfile = async (updates) => {
    setError(null);
    try {
      if (!updates) return;
      // If full user object passed from avatar upload
      if (updates._id && updates.email) {
        setUser((prev) => ({ ...prev, ...updates }));
        return { success: true, user: updates };
      }
      if (updates.avatar !== undefined && !updates.name && !updates.phone && !updates.gstin) {
        setUser((prev) => ({ ...prev, avatar: updates.avatar }));
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

export default AuthProvider;
