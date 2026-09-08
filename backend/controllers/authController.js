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
import User from '../models/User.js';
import { createNotification } from '../services/notification/notification.service.js';

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
  const { email, password, role } = req.body;

  try {
    const user = await authenticateCredentials(email, password, role);
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
    const { credential, accessToken, email, name, picture, googleId, role } = req.body;

    let userEmail = email;
    let userName = name;
    let userAvatar = picture;
    let userGoogleId = googleId;

    // 1. If accessToken is provided, query Google userinfo API
    if (accessToken && !userEmail) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const googleData = await userInfoRes.json();
          userEmail = googleData.email;
          userName = googleData.name || `${googleData.given_name || ''} ${googleData.family_name || ''}`.trim();
          userAvatar = googleData.picture;
          userGoogleId = googleData.sub;
        }
      } catch (tokenErr) {
        console.warn('[Google Sign-In] Could not fetch Google userinfo from access token:', tokenErr.message);
      }
    }

    // 2. If credential JWT string is sent from Google Identity Services
    if (credential && typeof credential === 'string' && !userEmail) {
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
    const targetRole = (role === 'VENDOR' || role === 'BRAND') ? 'BRAND' : 'CUSTOMER';
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
      if ((role === 'VENDOR' || role === 'BRAND') && (user.role === 'CUSTOMER' || user.role === 'USER')) {
        user.role = 'BRAND';
      }
      user.emailVerified = true;
      user.lastLogin = new Date();
      await user.save();

      // Dispatch Auth Notification (idempotent)
      createNotification({
        user: user._id,
        role: user.role || targetRole,
        type: 'AUTH',
        title: 'Google Sign-In Successful',
        message: `Welcome back, ${user.name}! You signed in via Google.`,
        referenceType: 'User',
        referenceId: user._id,
      }).catch((e) => console.warn('Auth notification notice:', e.message));

      return sendAuthTokenResponse(user, 200, res, {
        message: 'Successfully signed in with Google.',
      });
    }

    // Register new user via Google
    const newUser = await User.create({
      name: userName || (targetRole === 'BRAND' ? 'Vendor Partner' : 'Customer'),
      email: normalizedEmail,
      avatar: userAvatar || '',
      googleId: userGoogleId || `google_${Date.now()}`,
      authProvider: 'google',
      role: targetRole,
      emailVerified: true,
      status: 'Active',
      lastLogin: new Date(),
    });

    // Welcome Notification
    createNotification({
      user: newUser._id,
      role: targetRole,
      type: 'AUTH',
      title: 'Welcome to KAIA Technologies!',
      message: `Your account has been created via Google Sign-In. Start exploring premium technology products.`,
      referenceType: 'User',
      referenceId: newUser._id,
    }).catch((e) => console.warn('Welcome notification notice:', e.message));

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

/**
 * @desc    Authenticate or sync Clerk user
 * @route   POST /api/auth/clerk
 * @access  Public
 */
export const clerkLogin = async (req, res) => {
  try {
    const { clerkId, email, name, avatar, firstName, lastName, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for Clerk authentication.',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const targetRole = (role === 'VENDOR' || role === 'BRAND') ? 'BRAND' : 'CUSTOMER';
    let user = await User.findOne({
      $or: [
        { clerkId: clerkId || 'none' },
        { email: normalizedEmail }
      ]
    });

    const displayName = name || `${firstName || ''} ${lastName || ''}`.trim() || normalizedEmail.split('@')[0];

    if (user) {
      if (user.status === 'Suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }

      if (!user.clerkId && clerkId) {
        user.clerkId = clerkId;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }
      if ((role === 'VENDOR' || role === 'BRAND') && (user.role === 'CUSTOMER' || user.role === 'USER')) {
        user.role = 'BRAND';
      }
      user.emailVerified = true;
      user.lastLogin = new Date();
      await user.save();

      createNotification({
        user: user._id,
        role: user.role || targetRole,
        type: 'AUTH',
        title: 'Clerk Sign-In Successful',
        message: `Welcome back, ${user.name}! You signed in via Clerk.`,
        referenceType: 'User',
        referenceId: user._id,
      }).catch((e) => console.warn('Auth notification notice:', e.message));

      return sendAuthTokenResponse(user, 200, res, {
        message: 'Successfully signed in with Clerk.',
      });
    }

    // Register new user via Clerk
    const newUser = await User.create({
      name: displayName,
      firstName: firstName || '',
      lastName: lastName || '',
      email: normalizedEmail,
      avatar: avatar || '',
      clerkId: clerkId || `clerk_${Date.now()}`,
      authProvider: 'clerk',
      role: targetRole,
      emailVerified: true,
      status: 'Active',
      lastLogin: new Date(),
    });

    createNotification({
      user: newUser._id,
      role: targetRole,
      type: 'AUTH',
      title: 'Welcome to KAIA Technologies!',
      message: `Your account has been created via Clerk. Start exploring premium technology products.`,
      referenceType: 'User',
      referenceId: newUser._id,
    }).catch((e) => console.warn('Welcome notification notice:', e.message));

    return sendAuthTokenResponse(newUser, 201, res, {
      message: 'Account created with Clerk successfully.',
    });
  } catch (error) {
    console.error('Clerk Sign-In Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Clerk authentication failed. Please try again.',
    });
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
  clerkLogin,
  logoutUser,
  getMe,
  updateProfile,
};

