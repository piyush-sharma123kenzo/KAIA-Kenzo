/**
 * KAIA Technologies — User Registration Service
 * 
 * Strict "One Email = One Account" Rules:
 *  - Email Normalization: Trim & Lowercase
 *  - Email Format & Password Match / Strength Validation
 *  - Duplicate Handling:
 *      * If email exists and isVerified === true:
 *          -> Throws 409 Conflict: "This email is already registered. Please login."
 *      * If email exists and isVerified === false:
 *          -> Throws 409 Conflict: "An account already exists with this email but is not verified."
 *             with requiresVerification = true (Allows frontend to offer [Verify Email] and [Resend OTP])
 *             Does NOT recreate, duplicate, or delete user record.
 *      * If email does not exist:
 *          -> Creates new user account with isEmailVerified = false
 *          -> Generates cryptographically secure 6-digit OTP
 *          -> Stores hashed OTP in MongoDB (10-minute TTL)
 *          -> Dispatches OTP to exact recipient email
 *          -> Returns 201 Created response
 */

import User from '../../models/User.js';
import { generateAndSendOtp } from './otp.service.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user account and dispatch verification OTP.
 * 
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @param {string} [params.role='CUSTOMER']
 * @param {string} [params.phone='']
 * @param {string} [params.gstin='']
 * @returns {Promise<{ success: boolean, statusCode: number, message: string, email: string, requiresVerification: boolean }>}
 */
export const registerNewUser = async ({
  name,
  email,
  password,
  confirmPassword,
  role = 'CUSTOMER',
  phone = '',
  gstin = '',
}) => {
  // 1. Required fields validation
  if (!name || !email || !password || !confirmPassword) {
    const error = new Error('Please provide all required fields: Full Name, Email, Password, and Confirm Password.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Email format validation & Normalization (Trim + Lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Confirm password match
  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Password strength validation
  if (!PASSWORD_REGEX.test(password)) {
    const error = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
    );
    error.statusCode = 400;
    throw error;
  }

  const userRole = role === 'ADMIN' ? 'CUSTOMER' : (role || 'CUSTOMER');

  // 5. Strict Unique Email Check
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.emailVerified) {
      // Already verified account
      const error = new Error('This email is already registered. Please login.');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_REGISTERED';
      error.isVerified = true;
      error.requiresVerification = false;
      error.email = normalizedEmail;
      throw error;
    } else {
      // Existing unverified account
      const error = new Error('An account already exists with this email but is not verified.');
      error.statusCode = 409;
      error.code = 'EMAIL_UNVERIFIED';
      error.isVerified = false;
      error.requiresVerification = true;
      error.email = normalizedEmail;
      throw error;
    }
  }

  // 6. Create new unverified user account
  try {
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password, // Pre-save hook securely bcrypt-hashes password
      role: userRole,
      phone: phone ? phone.trim() : '',
      gstin: gstin ? gstin.trim() : '',
      emailVerified: false,
    });
  } catch (createErr) {
    if (createErr.code === 11000) {
      const error = new Error('This email is already registered. Please login.');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_REGISTERED';
      error.email = normalizedEmail;
      throw error;
    }
    throw createErr;
  }

  // 7. Generate and dispatch verification OTP
  await generateAndSendOtp(normalizedEmail, 'SIGNUP_VERIFICATION', { skipCooldown: true });

  return {
    success: true,
    statusCode: 201,
    message: `Verification code sent to ${normalizedEmail}. Please verify your email to complete registration.`,
    email: normalizedEmail,
    requiresVerification: true,
  };
};

export default {
  registerNewUser,
};
