/**
 * KAIA Technologies — Standardized API Error Class
 * 
 * Provides structured operational error formatting with status codes
 * for clean forwarding to the central error handling middleware.
 */

export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Array|object} [errors=[]] - Optional validation or field error details
   * @param {boolean} [isOperational=true] - Whether the error is a trusted operational error
   */
  constructor(message, statusCode = 500, errors = [], isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', errors = []) {
    return new ApiError(msg, 400, errors);
  }

  static unauthorized(msg = 'Authentication required. Please sign in.') {
    return new ApiError(msg, 401);
  }

  static forbidden(msg = 'You do not have permission to perform this action.') {
    return new ApiError(msg, 403);
  }

  static notFound(msg = 'Requested resource not found.') {
    return new ApiError(msg, 404);
  }

  static conflict(msg = 'A conflict occurred with existing data.') {
    return new ApiError(msg, 409);
  }

  static unprocessable(msg = 'Validation failed on submitted data.', errors = []) {
    return new ApiError(msg, 422, errors);
  }

  static tooManyRequests(msg = 'Too many requests. Please try again later.') {
    return new ApiError(msg, 429);
  }

  static internal(msg = 'Internal server error. Please try again later.') {
    return new ApiError(msg, 500, [], false);
  }
}

export default ApiError;
