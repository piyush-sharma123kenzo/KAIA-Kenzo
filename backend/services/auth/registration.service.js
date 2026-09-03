/**
 * KAIA Technologies — User Registration Service
 * 
 * Responsibilities:
 *  - Full name, email, password, and confirm password validation
 *  - Multi-domain email support (Gmail, Yahoo, Outlook, custom corporate domains)
 *  - Case-insensitive email normalization
 *  - Duplicate email checking:
 *      * If verified: returns "This email is already registered. Please login."
 *      * If unverified: updates credentials and dispatches fresh OTP (no duplicate key collision)
 *  - Cryptographic single-use OTP dispatch
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
    const error = new Error('Please provide all required fields: Full Name, Email, Password, and Confirm Password.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Email format validation
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

  // 5. Unique email check & unverified user resumption
  let existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.emailVerified) {
      const error = new Error('This email is already registered. Please login.');
      error.statusCode = 400;
      throw error;
    }

    // Update unverified user record with newest submitted credentials
    existingUser.name = name.trim();
    existingUser.password = password; // Pre-save hook hashes password securely
    existingUser.role = userRole;
    if (phone) existingUser.phone = phone.trim();
    if (gstin) existingUser.gstin = gstin.trim();
    await existingUser.save();
  } else {
    // Create new unverified user
    try {
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: userRole,
        phone: phone ? phone.trim() : '',
        gstin: gstin ? gstin.trim() : '',
        emailVerified: false,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        const error = new Error('This email is already registered. Please login.');
        error.statusCode = 400;
        throw error;
      }
      throw createErr;
    }
  }

  // 6. Generate and dispatch verification OTP
  const otpResult = await generateAndSendOtp(normalizedEmail, 'SIGNUP_VERIFICATION', { skipCooldown: true });

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}. Please verify your email to complete registration.`,
    email: normalizedEmail,
    requiresVerification: true,
  };
};

export default {
  registerNewUser,
};
