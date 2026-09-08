/**
 * KAIA Technologies — User & Profile Routes
 * 
 * Endpoints:
 *  - GET    /api/users/profile         -> Get current authenticated user profile
 *  - PUT    /api/users/profile         -> Update personal profile details
 *  - POST   /api/users/profile-image   -> Upload/Replace profile picture
 *  - POST   /api/users/profile/image   -> Upload/Replace profile picture (alias)
 *  - DELETE /api/users/profile-image   -> Remove profile picture
 *  - DELETE /api/users/profile/image   -> Remove profile picture (alias)
 *  - PUT    /api/users/change-password -> Secure dedicated password change
 *  - POST   /api/users/change-password -> Secure dedicated password change (alias)
 *  - DELETE /api/users/account         -> Customer self-deactivation with password
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  removeProfileImage,
  changePassword,
  deleteOwnAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import uploadProfileImageMiddleware from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload rate limiter: 30 upload requests per 15 minutes per IP
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many image upload attempts. Please try again in a few minutes.',
  },
});

// Password change rate limiter: 10 attempts per 15 minutes
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again later.',
  },
});

// All user routes require authentication
router.use(protect);

// 1. Profile Retrieval & Updates
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.patch('/profile', updateUserProfile);

// 2. Profile Image Operations (supporting both kebab-case & path variants)
router.post('/profile-image', uploadRateLimiter, uploadProfileImageMiddleware, uploadProfileImage);
router.post('/profile/image', uploadRateLimiter, uploadProfileImageMiddleware, uploadProfileImage);
router.delete('/profile-image', removeProfileImage);
router.delete('/profile/image', removeProfileImage);

// 3. Password Management
router.put('/change-password', passwordChangeLimiter, changePassword);
router.post('/change-password', passwordChangeLimiter, changePassword);

// 4. Account Deactivation
router.delete('/account', deleteOwnAccount);

export default router;
