import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  getMe,
  updateProfile,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/** Login: 10 attempts per 15 minutes per IP */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  skipSuccessfulRequests: true, // Only count failed attempts against the limit
});

/** Register: 5 registrations per hour per IP */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again in an hour.' },
});

/** Forgot Password: 5 requests per 15 minutes per IP */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please wait 15 minutes.' },
});

/** OTP Verification: 10 attempts per 15 minutes per IP */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP verification attempts. Please wait 15 minutes.' },
});

/** OTP Resend: 5 resend requests per 10 minutes per IP */
const otpResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many resend requests. Please wait before requesting a new code.' },
});

/** Reset Password: 5 attempts per 15 minutes per IP */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Please wait 15 minutes.' },
});

// ─── Public Authentication Endpoints ─────────────────────────────────────────
router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/google', googleLogin);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/resend-otp', otpResendLimiter, resendOtp);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// ─── Private Authenticated Endpoints ─────────────────────────────────────────
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
