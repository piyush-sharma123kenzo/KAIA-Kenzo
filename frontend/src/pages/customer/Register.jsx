import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Phone, ArrowRight, ShieldAlert, Eye, EyeOff, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import KaiaLogo from '../../components/common/KaiaLogo';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PasswordStrengthBar = ({ password }) => {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 rounded-full ${i <= strength ? colors[strength] : 'bg-brand-gray-200'} transition-all`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${strength === 4 ? 'text-emerald-600' : 'text-brand-gray-500'}`}>
          {labels[strength]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center space-x-1">
            {c.pass
              ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              : <XCircle className="w-3 h-3 text-brand-gray-300 shrink-0" />
            }
            <span className={`text-[10px] ${c.pass ? 'text-emerald-600' : 'text-brand-gray-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { user, register, resendOtp, error, clearError } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [conflictState, setConflictState] = useState(null); // { type: 'verified' | 'unverified', message, email }
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  useEffect(() => { clearError(); }, []);
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'BRAND') navigate('/brand/dashboard');
      else navigate('/account');
    }
  }, [user, navigate]);

  const confirmPasswordError = confirmPassword && password !== confirmPassword
    ? 'Passwords do not match.' : '';

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) clearError();
    if (validationError) setValidationError('');
    if (conflictState) setConflictState(null);
    if (resendSuccess) setResendSuccess('');
  };

  const handleResendUnverifiedOtp = async () => {
    const targetEmail = conflictState?.email || email.trim().toLowerCase();
    if (!targetEmail) return;
    setResending(true);
    setResendSuccess('');
    try {
      await resendOtp(targetEmail, 'SIGNUP_VERIFICATION');
      setResendSuccess(`New verification code sent to ${targetEmail}.`);
    } catch (err) {
      setValidationError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setConflictState(null);
    setResendSuccess('');

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) return setValidationError('Full name is required.');
    if (!normalizedEmail) return setValidationError('Email address is required.');
    if (!EMAIL_REGEX.test(normalizedEmail)) return setValidationError('Please enter a valid email address.');

    if (!PASSWORD_REGEX.test(password)) {
      return setValidationError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    if (password !== confirmPassword) {
      return setValidationError('Passwords do not match.');
    }

    if (!acceptTerms) {
      return setValidationError('You must agree to the Terms & Conditions and Privacy Policy.');
    }

    setLoading(true);
    try {
      const result = await register(trimmedName, normalizedEmail, password, confirmPassword, 'CUSTOMER', phone.trim());
      if (result?.requiresVerification) {
        navigate('/verify-otp', {
          state: {
            email: result.email || normalizedEmail,
            purpose: 'SIGNUP_VERIFICATION',
          },
        });
      } else if (result?.user) {
        navigate('/account');
      }
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'EMAIL_ALREADY_REGISTERED' || err.code === 'EMAIL_UNVERIFIED') {
        if (err.requiresVerification || err.isVerified === false || err.code === 'EMAIL_UNVERIFIED') {
          setConflictState({
            type: 'unverified',
            message: err.message || 'An account already exists with this email but is not verified.',
            email: err.email || normalizedEmail,
          });
        } else {
          setConflictState({
            type: 'verified',
            message: err.message || 'This email is already registered. Please login.',
            email: err.email || normalizedEmail,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-left space-y-8">

        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />
          <h1 className="text-xl font-extrabold text-brand-gray-950 tracking-tight pt-2">Create Customer Account</h1>
          <p className="text-xs text-brand-gray-500">A 6-digit verification code will be sent to your email.</p>
        </div>

        {/* 1. Unverified Account Conflict Banner with Action Buttons */}
        {conflictState?.type === 'unverified' && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm space-y-3 shadow-xs">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{conflictState.message}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Verify your email with the 6-digit code or request a new code.
                </p>
              </div>
            </div>

            {resendSuccess && (
              <div className="p-2 bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/verify-otp', { state: { email: conflictState.email, purpose: 'SIGNUP_VERIFICATION' } })}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded text-xs transition-all shadow-xs cursor-pointer text-center"
              >
                Verify Email →
              </button>
              <button
                type="button"
                onClick={handleResendUnverifiedOtp}
                disabled={resending}
                className="py-2 px-3 border border-amber-300 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded text-xs transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Verified Account Conflict Banner with Login Button */}
        {conflictState?.type === 'verified' && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-sm space-y-3 shadow-xs">
            <div className="flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{conflictState.message}</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  You already have an active account with this email address.
                </p>
              </div>
            </div>

            <Link
              to={`/login?email=${encodeURIComponent(conflictState.email)}`}
              className="block w-full bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold py-2 px-4 rounded text-xs transition-all shadow-xs text-center cursor-pointer"
            >
              Sign In to Your Account →
            </Link>
          </div>
        )}

        {/* 3. Generic Validation / Network Error Banner */}
        {!conflictState && (error || validationError) && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error || validationError}</span>
          </div>
        )}

        {/* Continue with Google */}
        <div className="space-y-4">
          <GoogleAuthButton text="Sign up with Google" mode="register" />

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or with email & password
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="text-xs font-semibold text-brand-gray-655">Full Name:</label>
            <div className="relative">
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your Full Name"
                value={name}
                onChange={handleInputChange(setName)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
              />
              <User className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-xs font-semibold text-brand-gray-655">Email Address:</label>
            <div className="relative">
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com or name@gmail.com"
                value={email}
                onChange={handleInputChange(setEmail)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
              />
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className="text-xs font-semibold text-brand-gray-655">Mobile Number (Optional):</label>
            <div className="relative">
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="9876543210"
                value={phone}
                onChange={handleInputChange(setPhone)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
              />
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="text-xs font-semibold text-brand-gray-655">Password:</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={handleInputChange(setPassword)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-14 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 text-brand-gray-400 hover:text-brand-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="reg-confirm" className="text-xs font-semibold text-brand-gray-655">Confirm Password:</label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleInputChange(setConfirmPassword)}
                className={`w-full bg-brand-light border pl-10 pr-14 py-2.5 rounded-sm text-sm focus:outline-none ${
                  confirmPasswordError ? 'border-red-400 focus:border-red-500' : 'border-brand-gray-250 focus:border-brand-accent'
                }`}
              />
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute right-3 top-2.5 text-brand-gray-400 hover:text-brand-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-[10px] text-red-500 font-bold flex items-center space-x-1">
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                <span>{confirmPasswordError}</span>
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-3.5 w-3.5 text-brand-accent focus:ring-brand-accent border-brand-gray-300 rounded-2xs"
            />
            <label htmlFor="terms" className="text-2xs text-brand-gray-500 select-none">
              I agree to the{' '}
              <Link to="/terms" className="text-brand-accent hover:underline font-semibold">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-brand-accent hover:underline font-semibold">Privacy Policy</Link>.
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-amber-500 text-white hover:text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.98]"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center border-t border-brand-gray-200 pt-4">
          <p className="text-xs text-brand-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-brand-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
