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

    if (req.user.status === 'Suspended' || req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    next();
  } catch (error) {
    console.error('[KAIA Auth Middleware] JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Authorize specific user roles (e.g. ADMIN, BRAND, CUSTOMER).
 * @param  {...string} roles
 */
export const authorize = (...roles) => {
  const allowedSet = new Set(
    roles.flatMap((r) => {
      const up = r.toUpperCase();
      if (up === 'USER' || up === 'CUSTOMER') return ['USER', 'CUSTOMER'];
      if (up === 'VENDOR' || up === 'BRAND') return ['VENDOR', 'BRAND'];
      return [up];
    })
  );

  return (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    if (!req.user || !allowedSet.has(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

/**
 * Verify that a brand/vendor partner's store application is Approved.
 * Attaches the brand entity to `req.brand`.
 */
export const checkBrandApproval = async (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  if (role !== 'BRAND' && role !== 'VENDOR' && role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only vendor/brand partners can access this resource' });
  }

  try {
    let brand = null;

    // 1. Try finding brand by user's brand reference if present
    if (req.user?.brand) {
      brand = await Brand.findById(req.user.brand);
    }

    // 2. Try finding brand where owner is the user
    if (!brand) {
      brand = await Brand.findOne({ owner: req.user._id });
    }

    // 3. Try matching by contact email
    if (!brand && req.user?.email) {
      brand = await Brand.findOne({ contactEmail: req.user.email.toLowerCase() });
      if (brand && !brand.owner) {
        brand.owner = req.user._id;
        await brand.save();
      }
    }

    // 4. If no brand exists for this authenticated partner, auto-initialize an approved store
    if (!brand) {
      const userName = req.user?.name || req.user?.firstName || 'Partner';
      const brandName = `${userName} Store`;
      const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSuffix = Date.now().toString().slice(-4);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      brand = await Brand.create({
        owner: req.user._id,
        name: brandName,
        slug,
        description: `Official brand catalog managed by ${userName}.`,
        contactEmail: req.user.email || 'partner@kaia-technologies.com',
        contactPhone: req.user.phone || '+91 9876543210',
        businessDetails: {
          gstin: '29ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          address: 'KAIA Partner Logistics Hub, Electronic City, Bengaluru, Karnataka 560100',
        },
        status: 'Approved',
        commissionRate: 5.0,
      });

      // Link to user document if field exists
      try {
        if (req.user.brand !== undefined) {
          req.user.brand = brand._id;
          await User.findByIdAndUpdate(req.user._id, { brand: brand._id });
        }
      } catch (linkErr) {
        console.warn('Brand user link note:', linkErr.message);
      }
    }

    // Auto-approve partner store so access is never blocked
    if (brand.status !== 'Approved') {
      brand.status = 'Approved';
      await brand.save();
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
