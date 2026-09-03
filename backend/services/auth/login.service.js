/**
 * KAIA Technologies — User Login Service
 * 
 * Responsibilities:
 *  - Email and password credential validation
 *  - Secure bcrypt password comparison
 *  - Account suspension checks
 *  - Enforcing email verification before allowing access
 */

import User from '../../models/User.js';

/**
 * Authenticate user credentials and return user entity.
 * 
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Authenticated User document
 */
export const authenticateCredentials = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Please provide an email and password.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  if (user.status === 'Suspended') {
    const error = new Error('Your account has been suspended by the platform administrator.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  // Block access if email is unverified
  if (user.emailVerified === false) {
    const error = new Error('Please verify your email before logging in.');
    error.statusCode = 403;
    error.requiresVerification = true;
    error.email = user.email;
    throw error;
  }

  return user;
};

export default {
  authenticateCredentials,
};
