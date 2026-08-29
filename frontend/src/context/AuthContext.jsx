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
        setUser(res.data.user);
        // Refresh full profiles to load associated brand details if brand operator
        const meRes = await axiosInstance.get('/auth/me');
        if (meRes.data.success) {
          setBrand(meRes.data.brand);
        }
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Register handler
  const register = async (name, email, password, role, phone) => {
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/register', { name, email, password, role, phone });
      if (res.data.success) {
        setUser(res.data.user);
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
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
      localStorage.removeItem('cart'); // optional clear guest cart on hard logout
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
        clearError,
        reloadSession: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
