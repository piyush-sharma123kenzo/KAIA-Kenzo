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
export const authenticateCredentials = async (email, password, selectedRole = null) => {
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

  if (user.status === 'Suspended' || user.isActive === false) {
    const error = new Error('Your account has been deactivated. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  // Strict database role verification if selectedRole is specified from login
  if (selectedRole && typeof selectedRole === 'string' && selectedRole.trim()) {
    const normSelected = selectedRole.trim().toUpperCase();
    const dbRole = String(user.role || 'CUSTOMER').trim().toUpperCase();

    const isMatchRole =
      (normSelected === 'ADMIN' && dbRole === 'ADMIN') ||
      ((normSelected === 'VENDOR' || normSelected === 'BRAND') && (dbRole === 'VENDOR' || dbRole === 'BRAND')) ||
      ((normSelected === 'USER' || normSelected === 'CUSTOMER') && (dbRole === 'USER' || dbRole === 'CUSTOMER'));

    if (!isMatchRole) {
      const error = new Error('The selected role does not match this account.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Block access if email is unverified
  if (user.emailVerified === false) {
    const error = new Error('Please verify your email before logging in.');
    error.statusCode = 403;
    error.requiresVerification = true;
    error.email = user.email;
    throw error;
  }

  // Record last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return user;
};

export default {
  authenticateCredentials,
};
