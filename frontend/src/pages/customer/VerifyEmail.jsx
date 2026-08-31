/**
 * VerifyEmail.jsx
 *
 * This route (/verify-email) is a legacy placeholder that is no longer the
 * active email verification mechanism.
 *
 * KAIA Technologies uses OTP-based email verification:
 *   /verify-otp  → the real verification page (6-digit OTP entry)
 *
 * This component redirects any visitor to the correct flow.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the real OTP verification entry point.
    // If there is no active session state, VerifyOtp will send the user to /login.
    navigate('/verify-otp', { replace: true });
  }, [navigate]);

  return null;
};

export default VerifyEmail;
