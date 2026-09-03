/**
 * KAIA Technologies — JWT & Authentication Token Utilities
 * 
 * Handles:
 *  - JWT token generation & validation
 *  - Secure HTTP-only cookie configuration
 *  - Standardized user payload serialization
 *  - Short-lived password reset session tokens
 */

import jwt from 'jsonwebtoken';

/**
 * Validate JWT_SECRET from environment variables.
 * @returns {string}
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET environment variable is not configured.');
  }
  return secret.trim();
};

/**
 * Generate a standard JSON Web Token.
 * @param {object} payload - Claims to embed in token
 * @param {string} [expiresIn='7d'] - Expiry duration
 * @returns {string}
 */
export const generateToken = (payload, expiresIn = '7d') => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Configure standard HTTP-only auth cookie options.
 * @returns {object}
 */
export const getAuthCookieOptions = () => ({
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

/**
 * Set authentication token as HTTP-only cookie on response.
 * @param {object} res - Express response
 * @param {string} token - JWT token string
 */
export const setAuthCookie = (res, token) => {
  res.cookie('token', token, getAuthCookieOptions());
};

/**
 * Clear authentication token cookie on response.
 * @param {object} res - Express response
 */
export const clearAuthCookie = (res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
};

/**
 * Format user entity into a safe client-facing profile object (strips sensitive fields).
 * @param {object} user - Mongoose User document or plain object
 * @returns {object}
 */
export const formatUserResponse = (user) => {
  const profileImageUrl = user.profileImage?.url || user.avatar || '';
  return {
    _id: user._id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: profileImageUrl,
    profileImage: {
      url: profileImageUrl,
      publicId: user.profileImage?.publicId || '',
      updatedAt: user.profileImage?.updatedAt || user.updatedAt || new Date(),
    },
    gstin: user.gstin,
    status: user.status,
    emailVerified: user.emailVerified,
  };
};

/**
 * Generate JWT and send formatted authentication JSON response with HTTP-only cookie.
 * @param {object} user - User document
 * @param {number} statusCode - HTTP status code
 * @param {object} res - Express response object
 * @param {object} [extraData={}] - Additional response payload
 */
export const sendAuthTokenResponse = (user, statusCode, res, extraData = {}) => {
  const token = generateToken({ id: user._id, role: user.role }, '7d');
  setAuthCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    user: formatUserResponse(user),
    token, // Provided for fallback in cross-origin / mobile environments
    ...extraData,
  });
};

/**
 * Issue short-lived password reset token after OTP verification.
 * @param {string} email
 * @returns {string}
 */
export const generateResetToken = (email) => {
  return generateToken({ email: email.toLowerCase().trim(), purpose: 'PASSWORD_RESET' }, '10m');
};

/**
 * Verify and decode password reset token.
 * @param {string} resetToken
 * @returns {object} Decoded token payload
 */
export const verifyResetToken = (resetToken) => {
  const secret = getJwtSecret();
  const decoded = jwt.verify(resetToken, secret);
  if (!decoded.email || decoded.purpose !== 'PASSWORD_RESET') {
    throw new Error('Invalid reset token purpose.');
  }
  return decoded;
};

export default {
  getJwtSecret,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  formatUserResponse,
  sendAuthTokenResponse,
  generateResetToken,
  verifyResetToken,
};
