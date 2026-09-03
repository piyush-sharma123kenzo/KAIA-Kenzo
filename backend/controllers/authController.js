/**
 * KAIA Technologies — Authentication Controller
 * 
 * HTTP request & response coordinator for:
 *  - Registration (/api/auth/register)
 *  - Login (/api/auth/login)
 *  - Logout (/api/auth/logout)
 *  - OTP Verification (/api/auth/verify-otp)
 *  - OTP Resend (/api/auth/resend-otp)
 *  - Forgot Password (/api/auth/forgot-password)
 *  - Reset Password (/api/auth/reset-password)
 *  - Current Profile (/api/auth/me)
 *  - Update Profile (/api/auth/profile)
 * 
 * Delegates business logic directly to domain services in services/auth/
 */

import {
  registerNewUser,
  authenticateCredentials,
  performLogout,
  verifySignupEmailOtp,
  resendSignupVerificationOtp,
  requestPasswordReset,
  resetUserPassword,
  verifyOtpCode,
  getUserProfile,
  updateUserProfile,
} from '../services/auth/auth.service.js';

import {
  sendAuthTokenResponse,
  generateResetToken,
} from '../utils/jwt.utils.js';

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const result = await registerNewUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error during registration. Please try again.',
      isVerified: error.isVerified,
      requiresVerification: error.requiresVerification,
      email: error.email,
      code: error.code,
    });
  }
};

/**
 * @desc    Verify 6-digit OTP for signup or password reset
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  const { email, otp, purpose } = req.body;

  try {
    if (!email || !otp || !purpose) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and purpose are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Signup verification flow -> activates account & creates login session
    if (purpose === 'SIGNUP_VERIFICATION') {
      const { user } = await verifySignupEmailOtp(normalizedEmail, otp);
      return sendAuthTokenResponse(user, 200, res, {
        message: 'Email verified successfully. You are now logged in.',
      });
    }

    // 2. Password reset flow -> consumes OTP and issues temporary reset token
    if (purpose === 'PASSWORD_RESET') {
      const verification = await verifyOtpCode(normalizedEmail, otp, 'PASSWORD_RESET');
      if (!verification.valid) {
        return res.status(400).json({ success: false, message: verification.error || 'Invalid or expired OTP.' });
      }

      const resetToken = generateResetToken(normalizedEmail);
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You may now set a new password.',
        resetToken,
        verified: true,
      });
    }

    // 3. Generic OTP verification
    const verification = await verifyOtpCode(normalizedEmail, otp, purpose);
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.error || 'Invalid or expired OTP.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error during OTP verification.',
    });
  }
};

/**
 * @desc    Resend 6-digit OTP verification code
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  const { email, purpose } = req.body;

  try {
    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: 'Email and purpose are required.' });
    }

    if (purpose === 'PASSWORD_RESET') {
      const result = await requestPasswordReset(email);
      return res.status(200).json(result);
    }

    const result = await resendSignupVerificationOtp(email);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error resending OTP.',
    });
  }
};

/**
 * @desc    Request Password Reset code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error processing password reset request.',
    });
  }
};

/**
 * @desc    Reset Password with verified session token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const result = await resetUserPassword(req.body);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error resetting password.',
    });
  }
};

/**
 * @desc    Login user credentials
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authenticateCredentials(email, password);
    return sendAuthTokenResponse(user, 200, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const responsePayload = {
      success: false,
      message: error.message || 'Server error during login.',
    };

    if (error.requiresVerification) {
      responsePayload.requiresVerification = true;
      responsePayload.email = error.email;
    }

    return res.status(statusCode).json(responsePayload);
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = async (req, res) => {
  const result = performLogout(res);
  return res.status(200).json(result);
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const profile = await getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      ...profile,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error fetching user profile.',
    });
  }
};

/**
 * @desc    Update user profile & GSTIN
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await updateUserProfile(req.user._id, req.body);
    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

/**
 * @desc    Google OAuth Sign In / Sign Up
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  try {
    const { credential, email, name, picture, googleId } = req.body;

    let userEmail = email;
    let userName = name;
    let userAvatar = picture;
    let userGoogleId = googleId;

    // If credential JWT string is sent from Google Identity Services
    if (credential && typeof credential === 'string') {
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          Buffer.from(base64, 'base64').toString('utf8')
        );
        const decoded = JSON.parse(jsonPayload);
        userEmail = decoded.email;
        userName = decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim();
        userAvatar = decoded.picture;
        userGoogleId = decoded.sub;
      } catch (e) {
        console.warn('Could not decode Google credential JWT, using payload fields:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Valid Google email is required for Google Sign-In.',
      });
    }

    const normalizedEmail = String(userEmail).toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.status === 'Suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }

      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
      }
      if (!user.avatar && userAvatar) {
        user.avatar = userAvatar;
      }
      user.emailVerified = true;
      await user.save();

      return sendAuthTokenResponse(user, 200, res, {
        message: 'Successfully signed in with Google.',
      });
    }

    // Register new user via Google
    const newUser = await User.create({
      name: userName || 'Customer',
      email: normalizedEmail,
      avatar: userAvatar || '',
      googleId: userGoogleId || `google_${Date.now()}`,
      authProvider: 'google',
      role: 'CUSTOMER',
      emailVerified: true,
      status: 'Active',
    });

    return sendAuthTokenResponse(newUser, 201, res, {
      message: 'Account created with Google successfully.',
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Google Sign-In failed. Please try again.',
    });
  }
};

export const cleanDatabase = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const OTP = (await import('../models/OTP.js')).default;
    const uRes = await User.deleteMany({});
    const oRes = await OTP.deleteMany({});
    return res.status(200).json({
      success: true,
      message: `Cleaned ${uRes.deletedCount} users and ${oRes.deletedCount} OTPs from database.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  registerUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  loginUser,
  googleLogin,
  logoutUser,
  getMe,
  updateProfile,
  cleanDatabase,
};
