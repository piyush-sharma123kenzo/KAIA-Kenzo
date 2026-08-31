import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const RESEND_COOLDOWN = 30; // seconds

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, user } = useContext(AuthContext);

  const { email = '', purpose = 'SIGNUP_VERIFICATION' } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if not coming from a registration / forgot-password flow
  useEffect(() => {
    if (!email) {
      navigate('/login');
    } else if (location.state?.devOtp && location.state.devOtp.length === 6) {
      setOtp(location.state.devOtp.split(''));
    }
  }, [email, location.state, navigate]);

  // Redirect on session creation (post-signup auto-login)
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'BRAND') navigate('/brand/dashboard');
      else navigate('/account');
    }
  }, [user, navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const getOtpString = () => otp.join('');

  const handleChange = (index, value) => {
    // Allow only numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Support paste of full 6-digit code
    if (value.length === 6) {
      const digits = value.slice(0, 6).split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      return;
    }

    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const otpString = getOtpString();
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, otpString, purpose);

      if (purpose === 'PASSWORD_RESET') {
        // The API returns a short-lived resetToken after OTP is consumed.
        // We pass this token to the reset-password page — NOT the raw OTP.
        navigate('/reset-password', {
          state: { email, resetToken: result.resetToken, verified: true },
        });
        return;
      }

      setSuccess('Email verified! Signing you in...');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
      // Clear OTP on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');
    try {
      await resendOtp(email, purpose);
      setSuccess('New verification code sent to your email.');
      setCooldown(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const purposeLabel = purpose === 'PASSWORD_RESET' ? 'Password Reset' : 'Email Verification';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-center space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <Link to="/" className="flex flex-col items-center select-none">
            <span className="text-2xl font-extrabold tracking-tight text-brand-gray-900 leading-none">
              KAIA
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-brand-gray-500 mt-1">
              TECHNOLOGIES
            </span>
          </Link>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-accent/10 border border-brand-accent/20 mx-auto">
            <ShieldCheck className="w-7 h-7 text-brand-accent" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">{purposeLabel}</h1>
            <p className="text-xs text-brand-gray-500 mt-1 leading-relaxed">
              A 6-digit verification code was sent to:<br />
              <strong className="text-brand-gray-800 font-bold">{email}</strong>
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-sm flex items-start space-x-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Input Grid */}
          <div>
            <label className="text-xs font-semibold text-brand-gray-655 block mb-3">
              Enter 6-Digit Code:
            </label>
            <div
              className="flex justify-center gap-3"
              onPaste={handlePaste}
              role="group"
              aria-label="One-time password input"
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  autoComplete="one-time-code"
                  aria-label={`OTP digit ${index + 1}`}
                  className={`w-11 h-13 text-center text-xl font-black border-2 rounded-sm bg-brand-light focus:outline-none transition-all ${
                    digit
                      ? 'border-brand-accent text-brand-gray-900'
                      : 'border-brand-gray-250 text-brand-gray-400'
                  } focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20`}
                  style={{ height: '52px' }}
                />
              ))}
            </div>
            <p className="text-[10px] text-brand-gray-400 mt-2">You can paste the code directly into the fields.</p>
          </div>

          <button
            type="submit"
            disabled={loading || getOtpString().length !== 6}
            className="w-full bg-brand-dark hover:bg-brand-gray-850 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
            <ShieldCheck className="w-4 h-4" />
          </button>
        </form>

        {/* Resend */}
        <div className="text-center space-y-2 border-t border-brand-gray-100 pt-4">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center space-x-1.5 text-xs text-brand-accent hover:underline font-bold disabled:opacity-60"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend Verification Code'}</span>
            </button>
          ) : (
            <p className="text-[11px] text-brand-gray-400">
              Resend code in <span className="font-bold text-brand-gray-700">{cooldown}s</span>
            </p>
          )}

          <div>
            <Link
              to={purpose === 'PASSWORD_RESET' ? '/forgot-password' : '/register'}
              className="inline-flex items-center space-x-1.5 text-xs text-brand-gray-500 hover:text-brand-accent font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{purpose === 'PASSWORD_RESET' ? 'Change Email' : 'Use Different Email'}</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtp;
