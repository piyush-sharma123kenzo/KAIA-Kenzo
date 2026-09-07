/**
 * KAIA Technologies — User & Profile Controller
 * 
 * Production-ready handlers for:
 *  - GET /api/users/profile -> Get current authenticated user profile
 *  - PUT /api/users/profile -> Update personal profile details (Name, Phone, Profile picture)
 *  - POST /api/users/profile-image -> Upload/Replace profile picture
 *  - DELETE /api/users/profile-image -> Remove profile picture
 *  - PUT /api/users/change-password -> Secure dedicated password change
 *  - DELETE /api/users/account -> Customer self-deactivation with password confirmation
 */

import { formatUserResponse, clearAuthCookie } from '../utils/jwt.utils.js';
import profileImageService from '../services/storage/profileImage.service.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Phone number regex: supports 10-digit Indian mobile or E.164 international format
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;

/**
 * @desc    Get authenticated user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    return res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('[UserController] getUserProfile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
};

/**
 * @desc    Update authenticated user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const { name, firstName, lastName, phone, profileImage, avatar } = req.body;

    // Validate Name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      if (name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Name must be between 2 and 100 characters.' });
      }
      user.name = name.trim();
    }

    if (firstName !== undefined && typeof firstName === 'string') {
      user.firstName = firstName.trim();
    }
    if (lastName !== undefined && typeof lastName === 'string') {
      user.lastName = lastName.trim();
    }

    // Auto-sync name if firstName & lastName provided
    if (user.firstName && user.lastName && (firstName !== undefined || lastName !== undefined) && !name) {
      user.name = `${user.firstName} ${user.lastName}`;
    }

    // Validate and update Phone if provided
    if (phone !== undefined) {
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
      if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Please provide a valid phone number.',
        });
      }
      user.phone = trimmedPhone;
    }

    // Update avatar/profileImage url if passed directly
    const imageUrl = profileImage?.url || profileImage || avatar;
    if (imageUrl && typeof imageUrl === 'string') {
      user.avatar = imageUrl.trim();
      if (!user.profileImage) user.profileImage = {};
      user.profileImage.url = imageUrl.trim();
      user.profileImage.updatedAt = new Date();
    }

    // NOTE: Security safeguard — email, role, password, isActive, and isEmailVerified
    // are strictly ignored and protected from customer-side modifications here.

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('[UserController] updateUserProfile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user profile.',
    });
  }
};

/**
 * @desc    Upload or replace current user's profile picture
 * @route   POST /api/users/profile-image
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
        message: 'No image file uploaded. Please select a JPG, PNG, or WEBP image (max 5 MB).',
      });
    }

    const updatedUser = await profileImageService.updateProfileImage(userId, req.file);

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully.',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('[UserController] uploadProfileImage error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload profile image.',
    });
  }
};

/**
 * @desc    Remove current user's profile picture
 * @route   DELETE /api/users/profile-image
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
    console.error('[UserController] removeProfileImage error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove profile image.',
    });
  }
};

/**
 * @desc    Dedicated secure password change
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Compare current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Security Alert Notification
    try {
      await Notification.create({
        user: user._id,
        title: 'Security Alert: Password Changed',
        message: 'Your account password was updated successfully. If this was not you, please contact support immediately.',
        type: 'Alert',
      });
    } catch (notifErr) {
      console.warn('[UserController] Security notification notice:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('[UserController] changePassword error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password.',
    });
  }
};

/**
 * @desc    Customer self-deactivation request
 * @route   DELETE /api/users/account
 * @access  Private
 */
export const deleteOwnAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required to deactivate your account.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password. Account deactivation cancelled.',
      });
    }

    // Soft delete: deactivate account
    user.isActive = false;
    user.status = 'Suspended';
    user.deletedAt = new Date();
    await user.save();

    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Your account has been deactivated successfully.',
    });
  } catch (error) {
    console.error('[UserController] deleteOwnAccount error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate account.',
    });
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  removeProfileImage,
  changePassword,
  deleteOwnAccount,
};
