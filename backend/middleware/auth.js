import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Brand from '../models/Brand.js';

export const protect = async (req, res, next) => {
  let token;

  // Read token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback to Bearer token header if needed
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyfor_kaia_technologies_2026');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (req.user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account is suspended' });
    }

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware to authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Middleware to attach brand data to request if role is BRAND
export const checkBrandApproval = async (req, res, next) => {
  if (req.user.role !== 'BRAND') {
    return res.status(403).json({ message: 'Only brand partners can access this resource' });
  }

  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) {
      return res.status(404).json({ message: 'No registered brand associated with this account' });
    }

    if (brand.status !== 'Approved') {
      return res.status(403).json({
        message: `Your brand partner account status is currently '${brand.status}'. Access is blocked until approval.`,
        brandStatus: brand.status,
      });
    }

    req.brand = brand;
    next();
  } catch (error) {
    console.error('Brand verification middleware error:', error);
    return res.status(500).json({ message: 'Error checking brand approval status' });
  }
};
