/**
 * KAIA Technologies — Forgot Password Service
 * 
 * Responsibilities:
 *  - Privacy-preserving password reset requests (no account enumeration)
 *  - Generating cryptographically secure password reset OTPs
 *  - Dispatching password reset security emails
 */

import User from '../../models/User.js';
import { generateAndSendOtp } from './otp.service.js';

/**
 * Handle forgot password request and send reset OTP if user exists.
 * 
 * @param {string} email - Submitted email address
 * @returns {Promise<{ success: boolean, message: string, email: string, devOtp?: string }>}
 */
export const requestPasswordReset = async (email) => {
  if (!email) {
    const error = new Error('Please provide your registered email address.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  let otpResult;
  // Send OTP only if user exists and is active
  if (user && user.status !== 'Suspended') {
    try {
      otpResult = await generateAndSendOtp(normalizedEmail, 'PASSWORD_RESET', { skipCooldown: false });
    } catch (otpError) {
      const error = new Error('Email service is temporarily unavailable. Please try again shortly.');
      error.statusCode = otpError.statusCode || 503;
      throw error;
    }
  }

  // Always return generic safe response to prevent email harvesting
  return {
    success: true,
    message: 'If an account exists for this email, a 6-digit password reset verification code has been sent.',
    email: normalizedEmail,
    ...(process.env.NODE_ENV !== 'production' && otpResult?.rawOtp ? { devOtp: otpResult.rawOtp } : {}),
  };
};

export default {
  requestPasswordReset,
};
