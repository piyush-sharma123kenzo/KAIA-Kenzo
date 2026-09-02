/**
 * KAIA Technologies — Authentication & Role Authorization Middleware
 * 
 * Middleware functions:
 *  - protect / authenticateUser: Validates JWT token from cookies or Bearer Authorization header
 *  - authorize / authorizeRoles: Validates user role matches allowed roles (e.g. 'CUSTOMER', 'BRAND', 'ADMIN')
 *  - checkBrandApproval: Verifies brand partner status is 'Approved' before granting seller dashboard access
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import { getJwtSecret } from '../utils/jwt.utils.js';

/**
 * Protect routes by verifying JWT in cookies or Authorization header.
 * Attaches authenticated user object to `req.user`.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Read token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Bearer token header if present
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'none') {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }

    if (req.user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    next();
  } catch (error) {
    console.error('[KAIA Auth Middleware] JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Authorize specific user roles (e.g. ADMIN, BRAND, CUSTOMER).
 * @param  {...string} roles
 */
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

/**
 * Verify that a brand partner's store application is Approved.
 * Attaches the brand entity to `req.brand`.
 */
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
    console.error('[KAIA Auth Middleware] Brand verification error:', error.message);
    return res.status(500).json({ message: 'Error checking brand approval status' });
  }
};

// Aliases for clear semantic readability
export const authenticateUser = protect;
export const authorizeRoles = authorize;

export default {
  protect,
  authenticateUser,
  authorize,
  authorizeRoles,
  checkBrandApproval,
};
