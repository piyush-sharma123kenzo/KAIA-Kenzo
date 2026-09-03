/**
 * KAIA Technologies — User Controller
 * 
 * Handles user profile endpoints:
 *  - Upload profile picture (POST /api/users/profile/image)
 *  - Remove profile picture (DELETE /api/users/profile/image)
 *  - Get user profile (GET /api/users/profile)
 */

import { formatUserResponse } from '../utils/jwt.utils.js';
import profileImageService from '../services/storage/profileImage.service.js';
import User from '../models/User.js';

/**
 * @desc    Upload or update current user's profile picture
 * @route   POST /api/users/profile/image
 * @access  Private
 */
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to upload profile image.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select a JPG, PNG, or WEBP image.',
      });
    }

    const updatedUser = await profileImageService.updateProfileImage(userId, req.file);

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('[UserController] Upload error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload profile image. Please try again.',
    });
  }
};

/**
 * @desc    Remove current user's profile picture
 * @route   DELETE /api/users/profile/image
 * @access  Private
 */
export const removeProfileImage = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to remove profile image.',
      });
    }

    const updatedUser = await profileImageService.deleteProfileImage(userId);

    return res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully.',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('[UserController] Remove error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove profile image.',
    });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

export default {
  uploadProfileImage,
  removeProfileImage,
  getUserProfile,
};
