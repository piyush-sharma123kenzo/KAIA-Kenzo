import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user session on application load
  const loadUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setBrand(response.data.brand);
      }
    } catch (err) {
      setUser(null);
      setBrand(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('kaia_token', res.data.token);
        }
        setUser(res.data.user);
        // Refresh full profile to load associated brand details for brand operators
        const meRes = await axiosInstance.get('/auth/me');
        if (meRes.data.success) {
          setBrand(meRes.data.brand);
        }
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      const requiresVerification = err.response?.data?.requiresVerification;
      const email = err.response?.data?.email;
      setError(errMsg);
      const error = new Error(errMsg);
      error.requiresVerification = requiresVerification;
      error.email = email;
      throw error;
    }
  };

  // Register handler — returns user and signs in immediately
  const register = async (name, email, password, confirmPassword, role, phone) => {
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword,
        role,
        phone,
      });
      if (res.data.success && res.data.user) {
        if (res.data.token) {
          localStorage.setItem('kaia_token', res.data.token);
        }
        setUser(res.data.user);
      }
      return res.data;
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
      const res = await axiosInstance.post('/auth/verify-otp', { email, otp, purpose });
      if (res.data.success && res.data.user) {
        if (res.data.token) {
          localStorage.setItem('kaia_token', res.data.token);
        }
        // Signup verification auto-signs in the user
        setUser(res.data.user);
      }
      return res.data;
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
      const res = await axiosInstance.post('/auth/resend-otp', { email, purpose });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Forgot Password — send OTP
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to process password reset request.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Reset Password — send resetToken (from verify-otp response) and new password
  const resetPassword = async (email, resetToken, newPassword, confirmPassword) => {
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Password reset failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setBrand(null);
      localStorage.removeItem('kaia_token');
      localStorage.removeItem('cart');
    }
  };

  // Update profile / GSTIN handler
  const updateProfile = async (name, phone, gstin) => {
    setError(null);
    try {
      const res = await axiosInstance.put('/auth/profile', { name, phone, gstin });
      if (res.data.success) {
        setUser(res.data.user);
        return res.data;
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
