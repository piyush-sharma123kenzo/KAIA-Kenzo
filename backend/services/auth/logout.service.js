/**
 * KAIA Technologies — User Logout Service
 * 
 * Responsibilities:
 *  - Clearing secure authentication cookies
 *  - Invalidating user session tokens
 */

import { clearAuthCookie } from '../../utils/jwt.utils.js';

/**
 * Log out user by clearing session cookies.
 * @param {object} res - Express response
 * @returns {{ success: boolean, message: string }}
 */
export const performLogout = (res) => {
  clearAuthCookie(res);
  return {
    success: true,
    message: 'Logged out successfully.',
  };
};

export default {
  performLogout,
};
