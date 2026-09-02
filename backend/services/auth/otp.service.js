/**
 * KAIA Technologies — OTP Service
 * 
 * Responsibilities:
 *  - Secure random 6-digit OTP generation (Node crypto.randomInt)
 *  - Bcrypt hashing before persistence (never plaintext in DB)
 *  - TTL expiration and attempt limiting
 *  - Anti-brute force and single-use invalidation
 *  - Per-email resend cooldown enforcement
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OTP from '../../models/OTP.js';
import { sendOtpEmail } from '../email/email.service.js';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate, persist, and dispatch a 6-digit OTP code.
 * 
 * @param {string} email - Recipient email
 * @param {string} purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
 * @param {object} [options]
 * @param {boolean} [options.skipCooldown=false] - Bypass cooldown (used on initial registration)
 * @returns {Promise<{ success: boolean, message: string, rawOtp: string }>}
 */
export const generateAndSendOtp = async (email, purpose, { skipCooldown = false } = {}) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Resend cooldown check
  if (!skipCooldown) {
    const cooldownThreshold = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000);
    const recentOtp = await OTP.findOne({
      email: normalizedEmail,
      purpose,
      createdAt: { $gt: cooldownThreshold },
    });

    if (recentOtp) {
      const secondsRemaining = Math.ceil(
        (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      const err = new Error(
        `A verification code was recently sent. Please wait ${secondsRemaining} second(s) before requesting a new code.`
      );
      err.statusCode = 429;
      throw err;
    }
  }

  // 2. Generate secure 6-digit random code
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // 3. Hash OTP before database storage
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);

  // 4. Remove previous active OTPs for this email + purpose
  await OTP.deleteMany({ email: normalizedEmail, purpose });

  // 5. Save hashed record with expiration
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await OTP.create({
    email: normalizedEmail,
    hashedOtp,
    purpose,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    verified: false,
    expiresAt,
  });

  // 6. Dispatch email
  try {
    await sendOtpEmail(normalizedEmail, rawOtp, purpose);
  } catch (emailErr) {
    console.error('[KAIA OTP] Failed to send email:', emailErr.message);
  }

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    rawOtp,
  };
};

/**
 * Verify a submitted 6-digit OTP code against the stored hash.
 * 
 * @param {string} email - User email
 * @param {string} enteredOtp - Submitted 6-digit code
 * @param {string} purpose - Expected OTP purpose
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export const verifyOtpCode = async (email, enteredOtp, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Format check
  if (!enteredOtp || !/^\d{6}$/.test(enteredOtp.trim())) {
    return { valid: false, error: 'OTP must be a 6-digit numeric code.' };
  }

  // 2. Find unverified OTP record
  const otpDoc = await OTP.findOne({
    email: normalizedEmail,
    purpose,
    verified: false,
  });

  if (!otpDoc) {
    return { valid: false, error: 'No active verification code found. Please request a new code.' };
  }

  // 3. Check expiration
  if (new Date() > otpDoc.expiresAt) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // 4. Check maximum attempts
  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return {
      valid: false,
      error: 'Too many incorrect attempts. This code has been invalidated. Please request a new verification code.',
    };
  }

  // 5. Compare with stored bcrypt hash
  const isMatch = await otpDoc.matchOtp(enteredOtp.trim());

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = otpDoc.maxAttempts - otpDoc.attempts;
    return {
      valid: false,
      error: remaining > 0
        ? `Invalid verification code. ${remaining} attempt(s) remaining.`
        : 'Invalid verification code. No attempts remaining — please request a new code.',
    };
  }

  // 6. Delete OTP on successful match (single use)
  otpDoc.verified = true;
  await otpDoc.save();
  await OTP.deleteOne({ _id: otpDoc._id });

  return { valid: true };
};

export default {
  generateAndSendOtp,
  verifyOtpCode,
};
