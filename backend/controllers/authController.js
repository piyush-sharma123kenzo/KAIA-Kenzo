import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Brand from '../models/Brand.js';

// Helper to generate JWT token and set in cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecretjwtkeyfor_kaia_technologies_2026',
    { expiresIn: '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  // Strip password before returning
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    gstin: user.gstin,
    status: user.status,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      user: userResponse,
      token, // Also return in body as fallback for mobile / testing clients
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role, phone, gstin } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Role safety checks: Admin accounts cannot be self-registered
    const userRole = role === 'ADMIN' ? 'CUSTOMER' : role;

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      gstin,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide an email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended by the platform administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
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

  res.status(200).json({ success: true, message: 'Logged out successfully' });
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
    console.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
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
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gstin !== undefined) {
      // Validate GSTIN format: e.g. 07AAAAA1111A1Z1 (15 alphanumeric)
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        return res.status(400).json({ message: 'Invalid Indian GSTIN format' });
      }
      user.gstin = gstin;
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
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error updating user profile' });
  }
};
