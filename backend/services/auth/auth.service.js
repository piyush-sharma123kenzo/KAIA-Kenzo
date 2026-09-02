/**
 * KAIA Technologies — Authentication Service Aggregator
 * 
 * Bundles all specialized authentication services:
 *  - registration.service.js
 *  - login.service.js
 *  - logout.service.js
 *  - emailVerification.service.js
 *  - forgotPassword.service.js
 *  - resetPassword.service.js
 *  - otp.service.js
 *  - profile.service.js
 */

export * from './registration.service.js';
export * from './login.service.js';
export * from './logout.service.js';
export * from './emailVerification.service.js';
export * from './forgotPassword.service.js';
export * from './resetPassword.service.js';
export * from './otp.service.js';
export * from './profile.service.js';

import { registerNewUser } from './registration.service.js';
import { authenticateCredentials } from './login.service.js';
import { performLogout } from './logout.service.js';
import { verifySignupEmailOtp, resendSignupVerificationOtp } from './emailVerification.service.js';
import { requestPasswordReset } from './forgotPassword.service.js';
import { resetUserPassword } from './resetPassword.service.js';
import { generateAndSendOtp, verifyOtpCode } from './otp.service.js';
import { getUserProfile, updateUserProfile } from './profile.service.js';

export default {
  registerNewUser,
  authenticateCredentials,
  performLogout,
  verifySignupEmailOtp,
  resendSignupVerificationOtp,
  requestPasswordReset,
  resetUserPassword,
  generateAndSendOtp,
  verifyOtpCode,
  getUserProfile,
  updateUserProfile,
};
