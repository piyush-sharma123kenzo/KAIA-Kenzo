/**
 * KAIA Technologies — Input Validation Middleware Pipeline
 * 
 * Pre-controller validation functions that reject invalid, malformed,
 * or unsafe inputs before hitting controllers or database queries.
 */

import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // Standard 10-digit Indian mobile format
const PINCODE_REGEX = /^\d{6}$/;    // Standard 6-digit Indian postal code

/**
 * Validate user registration payload
 */
export const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body || {};
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || String(password).length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (!name || !String(name).trim()) {
    errors.push('Full name is required.');
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

/**
 * Validate user login payload
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || !String(password).trim()) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

/**
 * Validate OTP verification payload
 */
export const validateOtp = (req, res, next) => {
  const { email, otp } = req.body || {};
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
    errors.push('OTP must be a valid 6-digit numeric code.');
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

/**
 * Validate Mongoose ObjectId route parameters
 * @param {string} paramName - Parameter name (e.g. 'id', 'productId')
 */
export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const idValue = req.params[paramName];
  if (!idValue || !mongoose.Types.ObjectId.isValid(idValue)) {
    return next(new ApiError(`Invalid identifier format for '${paramName}': ${idValue}`, 400));
  }
  next();
};

/**
 * Validate product creation and updates
 */
export const validateProductInput = (req, res, next) => {
  const { name, SKU, sellingPrice, mrp, stock } = req.body || {};
  const errors = [];

  if (name !== undefined && !String(name).trim()) {
    errors.push('Product name cannot be empty.');
  }

  if (SKU !== undefined && !String(SKU).trim()) {
    errors.push('SKU code cannot be empty.');
  }

  if (sellingPrice !== undefined) {
    const priceNum = Number(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.push('Selling price must be a positive number.');
    }
  }

  if (mrp !== undefined) {
    const mrpNum = Number(mrp);
    if (isNaN(mrpNum) || mrpNum < 0) {
      errors.push('MRP must be a non-negative number.');
    }
  }

  if (stock !== undefined) {
    const qty = typeof stock === 'object' ? stock.quantity : stock;
    if (qty !== undefined && (isNaN(Number(qty)) || Number(qty) < 0)) {
      errors.push('Stock quantity cannot be negative.');
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

/**
 * Validate customer address payload
 */
export const validateAddressInput = (req, res, next) => {
  const { recipientName, phone, postalCode, addressLine1, city, state } = req.body || {};
  const errors = [];

  if (!recipientName || !String(recipientName).trim()) {
    errors.push('Recipient full name is required.');
  }

  if (phone && !PHONE_REGEX.test(String(phone).replace(/\D/g, ''))) {
    errors.push('Phone number must be a valid 10-digit mobile number.');
  }

  if (!postalCode || !PINCODE_REGEX.test(String(postalCode).trim())) {
    errors.push('Postal PIN code must be a valid 6-digit number.');
  }

  if (!addressLine1 || !String(addressLine1).trim()) {
    errors.push('Address line 1 is required.');
  }

  if (!city || !String(city).trim()) {
    errors.push('City is required.');
  }

  if (!state || !String(state).trim()) {
    errors.push('State is required.');
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

/**
 * Validate cart addition & updates
 */
export const validateCartInput = (req, res, next) => {
  const { productId, quantity } = req.body || {};
  const errors = [];

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    errors.push('A valid Product ID is required.');
  }

  if (quantity !== undefined) {
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      errors.push('Quantity must be an integer of at least 1.');
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(errors.join(' '), 400, errors));
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validateOtp,
  validateObjectId,
  validateProductInput,
  validateAddressInput,
  validateCartInput,
};
