// Re-export the real authentication middleware from auth.js
// This file was previously a no-op stub — now properly enforces JWT authentication.
export { protect as authMiddleware } from './auth.js';