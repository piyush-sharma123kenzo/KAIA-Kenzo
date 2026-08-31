// Re-export the real role authorization middleware from auth.js
// This file was previously a no-op stub — now properly enforces role-based access control.
export { authorize as roleMiddleware } from './auth.js';