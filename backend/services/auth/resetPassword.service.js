/**
 * KAIA Technologies — Password Reset Service
 * 
 * Responsibilities:
 *  - Verifying password reset session tokens
 *  - Enforcing password strength and confirmation match
 *  - Updating user password securely via bcrypt
 */

import User from '../../models/User.js';
import { verifyResetToken } from '../../utils/jwt.utils.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Reset user password with verified reset token.
 * 
 * @param {object} params
 * @param {string} params.resetToken - Verified short-lived token from verify-otp
 * @param {string} params.newPassword
 * @param {string} params.confirmPassword
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resetUserPassword = async ({ resetToken, newPassword, confirmPassword }) => {
  if (!resetToken || !newPassword || !confirmPassword) {
    const error = new Error('Reset token, new password, and confirm password are all required.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Enforce password match
  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate password strength
  if (!PASSWORD_REGEX.test(newPassword)) {
    const error = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify short-lived reset token
  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch (err) {
    const error = new Error('Your password reset session has expired or is invalid. Please restart the forgot password process.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Update user password in database
  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  user.password = newPassword; // Pre-save hook hashes this with bcrypt
  await user.save();

  return {
    success: true,
    message: 'Your password has been successfully reset. You may now sign in with your new password.',
  };
};

export default {
  resetUserPassword,
};
