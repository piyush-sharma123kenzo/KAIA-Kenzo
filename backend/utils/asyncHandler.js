/**
 * KAIA Technologies — Async Route Handler Wrapper
 * 
 * Wraps asynchronous Express controller functions to catch any unhandled
 * promise rejections and forward them cleanly to the centralized error middleware.
 * 
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
