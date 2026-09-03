/**
 * KAIA Technologies — User Profile Service
 * 
 * Responsibilities:
 *  - Fetching authenticated user profile and associated brand details
 *  - Updating user personal details, phone numbers, and GSTIN
 */

import User from '../../models/User.js';
import Brand from '../../models/Brand.js';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Get profile data for current user.
 * @param {string} userId
 * @returns {Promise<{ user: object, brand: object|null }>}
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  let brand = null;
  if (user.role === 'BRAND') {
    brand = await Brand.findOne({ owner: user._id });
  }

  return { user, brand };
};

/**
 * Update personal profile information.
 * @param {string} userId
 * @param {object} updates
 * @param {string} [updates.name]
 * @param {string} [updates.phone]
 * @param {string} [updates.gstin]
 * @returns {Promise<object>}
 */
import { formatUserResponse } from '../../utils/jwt.utils.js';

export const updateUserProfile = async (userId, { name, phone, gstin, avatar }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (avatar !== undefined) {
    user.avatar = avatar;
    if (!user.profileImage) user.profileImage = {};
    user.profileImage.url = avatar;
    user.profileImage.updatedAt = new Date();
  }
  if (gstin !== undefined) {
    if (gstin && !GSTIN_REGEX.test(gstin.trim())) {
      const error = new Error('Invalid Indian GSTIN format.');
      error.statusCode = 400;
      throw error;
    }
    user.gstin = gstin ? gstin.trim().toUpperCase() : '';
  }

  await user.save();

  return formatUserResponse(user);
};

export default {
  getUserProfile,
  updateUserProfile,
};
