/**
 * KAIA Technologies — Profile Image Service
 * 
 * Orchestrates user profile picture operations:
 *  - Validation & uploading new image
 *  - Safe replacement (upload new -> save DB -> remove old)
 *  - Removing profile image & cleaning storage
 */

import User from '../../models/User.js';
import storageService from './storage.service.js';

/**
 * Upload and update user profile picture.
 * @param {string} userId - User ID
 * @param {object} file - Multer uploaded file
 * @returns {Promise<object>} Updated User document
 */
export const updateProfileImage = async (userId, file) => {
  if (!file) {
    const error = new Error('No profile image file was provided.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  // Keep reference of previous image for safe replacement
  const oldPublicId = user.profileImage?.publicId || '';
  const oldUrl = user.profileImage?.url || user.avatar || '';

  // 1. Upload new image to storage
  let newImageData;
  try {
    newImageData = await storageService.upload(file, user._id.toString());
  } catch (uploadError) {
    const error = new Error(`Failed to upload image: ${uploadError.message}`);
    error.statusCode = 500;
    throw error;
  }

  // 2. Update Database with new profile image & sync legacy avatar field
  try {
    user.profileImage = {
      url: newImageData.url,
      publicId: newImageData.publicId,
      updatedAt: newImageData.updatedAt || new Date(),
    };
    user.avatar = newImageData.url; // Keep synced for backward compatibility

    await user.save();
  } catch (dbError) {
    // Rollback: Clean up newly uploaded image to prevent orphan files
    await storageService.delete(newImageData.publicId, newImageData.url);
    const error = new Error('Failed to update user profile in database.');
    error.statusCode = 500;
    throw error;
  }

  // 3. Delete old image from storage only after successful DB save
  if (oldPublicId || oldUrl) {
    try {
      await storageService.delete(oldPublicId, oldUrl);
    } catch (cleanupErr) {
      console.warn('[ProfileImageService] Old image cleanup notice:', cleanupErr.message);
    }
  }

  return user;
};

/**
 * Remove user profile picture from storage and database.
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated User document
 */
export const deleteProfileImage = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  const publicId = user.profileImage?.publicId || '';
  const url = user.profileImage?.url || user.avatar || '';

  // 1. Delete image from storage
  if (publicId || url) {
    await storageService.delete(publicId, url);
  }

  // 2. Reset database fields
  user.profileImage = {
    url: '',
    publicId: '',
    updatedAt: new Date(),
  };
  user.avatar = '';

  await user.save();
  return user;
};

export default {
  updateProfileImage,
  deleteProfileImage,
};
