/**
 * KAIA Technologies — Authentication API Service
 * 
 * Centralized client for all authentication endpoints:
 *  - Registration (/api/auth/register)
 *  - Login (/api/auth/login)
 *  - Logout (/api/auth/logout)
 *  - Email / OTP Verification (/api/auth/verify-otp)
 *  - Resend OTP (/api/auth/resend-otp)
 *  - Forgot Password (/api/auth/forgot-password)
 *  - Reset Password (/api/auth/reset-password)
 *  - Current Session (/api/auth/me)
 *  - Profile Update (/api/auth/profile)
 */

import axiosInstance from '../api/axiosInstance';

/**
 * Register a new customer or seller account.
 * @param {object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.confirmPassword
 * @param {string} [userData.role='CUSTOMER']
 * @param {string} [userData.phone]
 * @param {string} [userData.gstin]
 * @returns {Promise<object>}
 */
export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

/**
 * Log in with email and password credentials.
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<object>}
 */
export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

/**
 * Verify a 6-digit OTP code for signup or password reset.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @param {string} params.purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET'
 * @returns {Promise<object>}
 */
export const verifyEmailOtp = async ({ email, otp, purpose }) => {
  const response = await axiosInstance.post('/auth/verify-otp', { email, otp, purpose });
  return response.data;
};

/**
 * Resend a 6-digit verification code.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET'
 * @returns {Promise<object>}
 */
export const resendEmailOtp = async ({ email, purpose }) => {
  const response = await axiosInstance.post('/auth/resend-otp', { email, purpose });
  return response.data;
};

/**
 * Send password reset request OTP.
 * @param {string} email
 * @returns {Promise<object>}
 */
export const forgotPassword = async (email) => {
  const response = await axiosInstance.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset user password with verified reset token.
 * @param {object} params
 * @param {string} params.resetToken
 * @param {string} params.newPassword
 * @param {string} params.confirmPassword
 * @returns {Promise<object>}
 */
export const resetPassword = async ({ resetToken, newPassword, confirmPassword }) => {
  const response = await axiosInstance.post('/auth/reset-password', {
    resetToken,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

/**
 * Fetch current authenticated user session & brand profile.
 * @returns {Promise<object>}
 */
export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

/**
 * Update personal profile details and GSTIN.
 * @param {object} updates
 * @returns {Promise<object>}
 */
export const updateUserProfile = async (updates) => {
  const response = await axiosInstance.put('/auth/profile', updates);
  return response.data;
};

/**
 * Terminate user session and clear authentication cookie.
 * @returns {Promise<object>}
 */
export const logoutUser = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

export default {
  registerUser,
  loginUser,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
};
