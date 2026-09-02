/**
 * KAIA Technologies — Email Verification Service
 * 
 * Responsibilities:
 *  - Verifying 6-digit OTP codes for account registration
 *  - Updating user document to emailVerified: true
 *  - Preparing authenticated session payload
 *  - Handling resend verification code requests
 */

import User from '../../models/User.js';
import { verifyOtpCode, generateAndSendOtp } from './otp.service.js';

/**
 * Verify signup email verification OTP and activate user account.
 * 
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export const verifySignupEmailOtp = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verify submitted OTP code against stored bcrypt hash
  const verification = await verifyOtpCode(normalizedEmail, otp, 'SIGNUP_VERIFICATION');
  if (!verification.valid) {
    const error = new Error(verification.error || 'Invalid or expired verification code.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Locate user and activate account
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  user.emailVerified = true;
  await user.save();

  return {
    success: true,
    user,
  };
};

/**
 * Resend email verification code.
 * 
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string, devOtp?: string }>}
 */
export const resendSignupVerificationOtp = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return {
      success: true,
      message: `A new verification code has been dispatched to ${normalizedEmail}.`,
    };
  }

  if (user.emailVerified) {
    const error = new Error('This account is already verified. Please sign in.');
    error.statusCode = 400;
    throw error;
  }

  const otpResult = await generateAndSendOtp(normalizedEmail, 'SIGNUP_VERIFICATION', { skipCooldown: false });

  return {
    success: true,
    message: `A new 6-digit verification code has been dispatched to ${normalizedEmail}.`,
    ...(process.env.NODE_ENV !== 'production' && otpResult?.rawOtp ? { devOtp: otpResult.rawOtp } : {}),
  };
};

export default {
  verifySignupEmailOtp,
  resendSignupVerificationOtp,
};
