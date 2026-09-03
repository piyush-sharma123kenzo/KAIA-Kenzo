/**
 * KAIA Technologies — User & Profile Routes
 * 
 * Endpoints:
 *  - POST   /api/users/profile/image -> Upload/Replace profile picture
 *  - DELETE /api/users/profile/image -> Remove profile picture
 *  - GET    /api/users/profile       -> Get user profile
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  uploadProfileImage,
  removeProfileImage,
  getUserProfile,
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
  message: {
    success: false,
    message: 'Too many image upload attempts. Please try again in a few minutes.',
  },
});

// All user routes require authentication
router.use(protect);

router.post('/profile/image', uploadRateLimiter, uploadProfileImageMiddleware, uploadProfileImage);
router.delete('/profile/image', removeProfileImage);
router.get('/profile', getUserProfile);
router.get('/profile/image', getUserProfile);

export default router;
