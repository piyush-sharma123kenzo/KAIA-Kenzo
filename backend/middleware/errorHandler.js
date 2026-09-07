/**
 * KAIA Technologies — Centralized Production Error Handling Middleware
 * 
 * Intercepts all Express errors and formats consistent, safe JSON responses:
 * {
 *   "success": false,
 *   "message": "User-friendly safe message",
 *   "errors": [] // Optional validation details
 * }
 */

import logger from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

/**
 * 404 Not Found handler for undefined API routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Central Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal server error. Please try again.';
  let errors = err.errors || [];

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid identifier: ${err.value}`;
  }

  // 2. Mongoose Validation Error (ValidationError)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationErrors = Object.values(err.errors || {}).map((val) => val.message);
    message = validationErrors.join('. ') || 'Validation failed on submitted data.';
    errors = validationErrors;
  }

  // 3. MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `An entry with ${field} '${val}' already exists.`;
  }

  // 4. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication token is invalid. Please sign in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication session has expired. Please sign in again.';
  }

  // 5. Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum permitted limit (5MB).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field submitted.';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Log server-side errors
  if (statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${req.method} ${req.originalUrl}`, err);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Response payload (never leak internal stack trace in production)
  const isProduction = process.env.NODE_ENV === 'production';
  const responsePayload = {
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
    ...(!isProduction && err.stack ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(responsePayload);
};

export default {
  notFoundHandler,
  errorHandler,
};
