import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import { generateAndSendOtp, verifyOtpCode } from '../utils/otpService.js';

// Password policy: min 8 chars, uppercase, lowercase, number
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Validate JWT_SECRET is configured — fail loudly at runtime if missing
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[KAIA Auth] FATAL: JWT_SECRET environment variable is not set. Authentication cannot proceed securely.');
    throw new Error('JWT_SECRET is not configured.');
  }
  return secret;
};

// Helper to generate JWT and set as HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  const secret = getJwtSecret();
  const token = jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  // Strip password before returning user object
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    gstin: user.gstin,
    status: user.status,
    emailVerified: user.emailVerified,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: userResponse,
      token, // Also return in body as fallback for mobile/testing clients
    });
};

// @desc    Register a new user (with password confirmation & OTP email generation)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword, role, phone, gstin } = req.body;

  try {
    // 1. Required fields validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and confirmPassword.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Confirm Password must always be validated — never trust frontend alone
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // 3. Password strength policy
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    // 4. Admin role cannot be self-registered
    const userRole = role === 'ADMIN' ? 'CUSTOMER' : (role || 'CUSTOMER');

    // 5. Check for duplicate email
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      // If account exists but is unverified: update details and resend OTP
      existingUser.name = name.trim();
      existingUser.password = password; // Pre-save hook hashes this
      existingUser.role = userRole;
      if (phone) existingUser.phone = phone.trim();
      if (gstin) existingUser.gstin = gstin.trim();
      await existingUser.save();
    } else {
      // Create new unverified user
      existingUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: userRole,
        phone: phone ? phone.trim() : '',
        gstin: gstin ? gstin.trim() : '',
        emailVerified: false,
      });
    }

    // 6. Generate and dispatch OTP
    // skipCooldown:true so that re-submitting the form (e.g. after a page refresh)
    // never hits the 60s per-email cooldown that's meant for the resend endpoint only.
    let otpResult = { success: true };
    try {
      otpResult = await generateAndSendOtp(normalizedEmail, 'SIGNUP_VERIFICATION', { skipCooldown: true });
    } catch (otpError) {
      console.warn('[Auth] OTP notice:', otpError.message);
    }

    res.status(201).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}. Please verify your email to complete registration.`,
      email: normalizedEmail,
      requiresVerification: true,
      devOtp: otpResult?.rawOtp,
    });
  } catch (error) {
    console.error('[Auth] Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

// @desc    Verify 6-digit OTP for signup or password reset
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  const { email, otp, purpose } = req.body;

  try {
    if (!email || !otp || !purpose) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and purpose are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify OTP against hashed record — this also deletes the OTP on success
    const verification = await verifyOtpCode(normalizedEmail, otp, purpose);

    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.error || 'Invalid or expired OTP.' });
    }

    // 2. Handle purpose-specific actions
    if (purpose === 'SIGNUP_VERIFICATION') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      user.emailVerified = true;
      await user.save();

      // Auto-sign-in after successful signup verification
      return sendTokenResponse(user, 200, res);
    }

    if (purpose === 'PASSWORD_RESET') {
      // OTP is now consumed. Issue a short-lived resetToken so the client
      // can call /reset-password without re-verifying the (already deleted) OTP.
      const secret = getJwtSecret();
      const resetToken = jwt.sign(
        { email: normalizedEmail, purpose: 'PASSWORD_RESET' },
        secret,
        { expiresIn: '10m' }
      );

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You may now set a new password.',
        resetToken,
        verified: true,
      });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('[Auth] Verify OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

// @desc    Resend 6-digit OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
  const { email, purpose } = req.body;

  try {
    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: 'Email and purpose are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate the user/email exists for the stated purpose
    if (purpose === 'SIGNUP_VERIFICATION') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Generic safe response — don't reveal whether email exists
        return res.status(200).json({
          success: true,
          message: `A new verification code has been sent to ${normalizedEmail}.`,
        });
      }
      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'This account is already verified. Please sign in.',
        });
      }
    } else if (purpose === 'PASSWORD_RESET') {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Safe generic response — no account enumeration
        return res.status(200).json({
          success: true,
          message: `A new verification code has been sent to ${normalizedEmail}.`,
        });
      }
      if (user.status === 'Suspended') {
        return res.status(403).json({ success: false, message: 'This account has been suspended.' });
      }
    }

    try {
      await generateAndSendOtp(normalizedEmail, purpose, { skipCooldown: false });
    } catch (otpError) {
      const statusCode = otpError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: otpError.message || 'Failed to resend verification code. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been dispatched to ${normalizedEmail}.`,
    });
  } catch (error) {
    console.error('[Auth] Resend OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error resending OTP.' });
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Prevent account enumeration — always return the same safe response
    if (user && user.status !== 'Suspended') {
      try {
        await generateAndSendOtp(normalizedEmail, 'PASSWORD_RESET', { skipCooldown: false });
      } catch (otpError) {
        // In production, surface email delivery failures
        if (process.env.NODE_ENV === 'production' && otpError.statusCode === 503) {
          return res.status(503).json({ success: false, message: 'Email service is temporarily unavailable. Please try again shortly.' });
        }
        // For cooldown errors, still return the safe generic message (no account enumeration)
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a 6-digit password reset verification code has been sent.',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('[Auth] Forgot Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error processing password reset request.' });
  }
};

// @desc    Reset Password using a verified resetToken (issued by verify-otp)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  try {
    // 1. All fields required
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token, new password, and confirm password are all required.',
      });
    }

    // 2. Confirm password match — always enforced, never optional
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // 3. Password strength policy
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    // 4. Verify the short-lived resetToken issued by verify-otp
    let decoded;
    try {
      const secret = getJwtSecret();
      decoded = jwt.verify(resetToken, secret);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Your password reset session has expired or is invalid. Please restart the forgot password process.',
      });
    }

    if (!decoded.email || decoded.purpose !== 'PASSWORD_RESET') {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    // 5. Find user and update password
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.password = newPassword; // Pre-save hook will hash
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by the platform administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Block login if email not verified
    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('[Auth] Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let brand = null;

    if (user.role === 'BRAND') {
      brand = await Brand.findOne({ owner: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      brand,
    });
  } catch (error) {
    console.error('[Auth] Get Me Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
};

// @desc    Update user profile / billing / GSTIN details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { name, phone, gstin } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (gstin !== undefined) {
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        return res.status(400).json({ success: false, message: 'Invalid Indian GSTIN format.' });
      }
      user.gstin = gstin ? gstin.trim().toUpperCase() : '';
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gstin: user.gstin,
      },
    });
  } catch (error) {
    console.error('[Auth] Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating user profile.' });
  }
};
