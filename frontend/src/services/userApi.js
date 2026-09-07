/**
 * KAIA Technologies — User & Profile API Service
 * 
 * Production-ready customer user API service:
 *  - Fetch user profile (GET /api/users/profile)
 *  - Update personal profile details (PUT /api/users/profile)
 *  - Upload / Replace profile image (POST /api/users/profile-image)
 *  - Remove profile image (DELETE /api/users/profile-image)
 *  - Change password (PUT /api/users/change-password)
 *  - Deactivate account (DELETE /api/users/account)
 */

import axiosInstance from '../api/axiosInstance';

/**
 * Fetch authenticated user profile data.
 * @returns {Promise<object>}
 */
export const getUserProfile = async () => {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
};

/**
 * Update personal profile details (Name, Phone, Avatar).
 * @param {object} payload - Profile fields to update
 * @returns {Promise<object>}
 */
export const updateUserProfile = async (payload) => {
  const response = await axiosInstance.put('/users/profile', payload);
  return response.data;
};

/**
 * Upload or replace user profile picture.
 * @param {FormData} formData - Multipart form data containing 'profileImage'
 * @returns {Promise<object>}
 */
export const uploadProfileImage = async (formData) => {
  const response = await axiosInstance.post('/users/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Remove user profile picture and reset to default avatar.
 * @returns {Promise<object>}
 */
export const removeProfileImage = async () => {
  const response = await axiosInstance.delete('/users/profile-image');
  return response.data;
};

/**
 * Secure password change.
 * @param {object} payload - { currentPassword, newPassword, confirmPassword }
 * @returns {Promise<object>}
 */
export const changePassword = async (payload) => {
  const response = await axiosInstance.put('/users/change-password', payload);
  return response.data;
};

/**
 * Self-deactivate account.
 * @param {object} payload - { password }
 * @returns {Promise<object>}
 */
export const deleteAccount = async (payload) => {
  const response = await axiosInstance.delete('/users/account', { data: payload });
  return response.data;
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  removeProfileImage,
  changePassword,
  deleteAccount,
};
