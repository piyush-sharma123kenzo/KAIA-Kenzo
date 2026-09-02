/**
 * KAIA Technologies — User Registration Service
 * 
 * Responsibilities:
 *  - Full name, email, password, and confirm password validation
 *  - Password strength verification (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 *  - Duplicate email checks and unverified user profile refreshes
 *  - Initial unverified user document creation
 *  - Verification OTP dispatch triggering
 */

import User from '../../models/User.js';
import { generateAndSendOtp } from './otp.service.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

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
 * @returns {Promise<{ success: boolean, message: string, email: string, requiresVerification: boolean, devOtp?: string }>}
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
    const error = new Error('Please provide all required fields: name, email, password, and confirmPassword.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Confirm password match
  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Password strength validation
  if (!PASSWORD_REGEX.test(password)) {
    const error = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
    );
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userRole = role === 'ADMIN' ? 'CUSTOMER' : (role || 'CUSTOMER');

  // 4. Duplicate email check
  let existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.emailVerified) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 400;
      throw error;
    }
    // Update unverified user record with newest submitted credentials
    existingUser.name = name.trim();
    existingUser.password = password; // Pre-save hook hashes this
    existingUser.role = userRole;
    if (phone) existingUser.phone = phone.trim();
    if (gstin) existingUser.gstin = gstin.trim();
    await existingUser.save();
  } else {
    // Create new unverified user
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: userRole,
      phone: phone ? phone.trim() : '',
      gstin: gstin ? gstin.trim() : '',
      emailVerified: false,
    });
  }

  // 5. Generate and dispatch verification OTP
  const otpResult = await generateAndSendOtp(normalizedEmail, 'SIGNUP_VERIFICATION', { skipCooldown: true });

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}. Please verify your email to complete registration.`,
    email: normalizedEmail,
    requiresVerification: true,
    ...(process.env.NODE_ENV !== 'production' && otpResult?.rawOtp ? { devOtp: otpResult.rawOtp } : {}),
  };
};

export default {
  registerNewUser,
};
