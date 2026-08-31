import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import { sendOtpEmail } from './emailService.js';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60; // Minimum seconds between resend requests per email+purpose

/**
 * Generate and dispatch a secure 6-digit OTP.
 *
 * Security guarantees:
 *   - OTP is cryptographically random (Node crypto.randomInt)
 *   - Stored as bcrypt hash — never plaintext in DB
 *   - Previous OTPs for same email+purpose are deleted before creating new one
 *   - Per-email cooldown prevents resend spam (independent of IP rate limiting)
 *   - If email delivery fails in production, the stored OTP is cleaned up
 *     so we never tell the user "OTP sent" when it wasn't
 *
 * @param {string} email
 * @param {string} purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE'
 * @param {object} [options]
 * @param {boolean} [options.skipCooldown=false] - Skip per-email cooldown (used by registration endpoint)
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} if per-email cooldown is active, or if email delivery fails in production
 */
export const generateAndSendOtp = async (email, purpose, { skipCooldown = false } = {}) => {
  const normalizedEmail = email.toLowerCase().trim();

  // ── Per-email resend cooldown check ─────────────────────────────────
  // Only applied when skipCooldown is false (i.e. the resend-otp endpoint).
  // Registration always bypasses this so re-submitting the form never blocks.
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

  // ── Generate cryptographically secure 6-digit OTP ────────────────────────
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // ── Hash OTP before database storage — never store plaintext ─────────────
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);

  // ── Delete any existing OTPs for this email+purpose ──────────────────────
  await OTP.deleteMany({ email: normalizedEmail, purpose });

  // ── Persist hashed OTP with expiry ───────────────────────────────────────
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  let otpRecord;
  try {
    otpRecord = await OTP.create({
      email: normalizedEmail,
      hashedOtp,
      purpose,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      verified: false,
      expiresAt,
    });
  } catch (dbError) {
    console.error('[KAIA OTP] Failed to persist OTP record:', dbError.message);
    throw new Error('Failed to generate verification code. Please try again.');
  }

  // ── Send OTP via email ────────────────────────────────────────────────────
  // If email dispatch fails in production, we MUST clean up the stored OTP
  // so we do not falsely report success to the user.
  try {
    await sendOtpEmail(normalizedEmail, rawOtp, purpose);
  } catch (emailError) {
    // Roll back: delete the OTP record so we don't leave an unusable code in DB
    await OTP.deleteOne({ _id: otpRecord._id }).catch(() => {});
    // Re-throw so the controller surfaces the real error
    throw emailError;
  }

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  };
};

/**
 * Verify a submitted 6-digit OTP against the stored hashed record.
 *
 * Security guarantees:
 *   - Checks expiry explicitly (TTL index is a cleanup tool, not a security gate)
 *   - Tracks attempt count; OTP invalidated after MAX_ATTEMPTS failures
 *   - Deletes OTP record on success (single-use)
 *   - Validates purpose — a SIGNUP OTP cannot verify a PASSWORD_RESET
 *
 * @param {string} email
 * @param {string} enteredOtp - The 6-digit code submitted by the user
 * @param {string} purpose
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export const verifyOtpCode = async (email, enteredOtp, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Validate format before hitting the database
  if (!enteredOtp || !/^\d{6}$/.test(enteredOtp.trim())) {
    return { valid: false, error: 'OTP must be a 6-digit numeric code.' };
  }

  // 2. Find active (unverified) OTP document for this exact email + purpose
  //    Purpose mismatch is caught here — a SIGNUP OTP cannot be used for PASSWORD_RESET
  const otpDoc = await OTP.findOne({
    email: normalizedEmail,
    purpose,
    verified: false,
  });

  if (!otpDoc) {
    return { valid: false, error: 'No active verification code found. Please request a new code.' };
  }

  // 3. Check expiration explicitly
  //    (TTL index auto-deletes, but we check here to give a meaningful message)
  if (new Date() > otpDoc.expiresAt) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return { valid: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // 4. Check attempt limit — prevent brute force
  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    await OTP.deleteOne({ _id: otpDoc._id });
    return {
      valid: false,
      error: 'Too many incorrect attempts. This code has been invalidated. Please request a new verification code.',
    };
  }

  // 5. Compare submitted OTP against stored bcrypt hash
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

  // 6. OTP matched — mark verified and delete (single-use enforcement)
  otpDoc.verified = true;
  await otpDoc.save();
  await OTP.deleteOne({ _id: otpDoc._id });

  return { valid: true };
};
