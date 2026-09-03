/**
 * KAIA Technologies — User & Profile API Service
 * 
 * Handles user profile endpoints:
 *  - Upload / Replace profile image (POST /api/users/profile/image)
 *  - Remove profile image (DELETE /api/users/profile/image)
 *  - Fetch user profile (GET /api/users/profile)
 */

import axiosInstance from '../api/axiosInstance';

/**
 * Upload or replace user profile picture.
 * @param {FormData} formData - Multipart form data containing 'profileImage'
 * @returns {Promise<object>}
 */
export const uploadProfileImage = async (formData) => {
  const response = await axiosInstance.post('/users/profile/image', formData, {
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
  const response = await axiosInstance.delete('/users/profile/image');
  return response.data;
};

/**
 * Fetch authenticated user profile data.
 * @returns {Promise<object>}
 */
export const getUserProfile = async () => {
  const response = await axiosInstance.get('/users/profile');
  return response.data;
};

export default {
  uploadProfileImage,
  removeProfileImage,
  getUserProfile,
};
