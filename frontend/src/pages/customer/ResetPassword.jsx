import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ShieldAlert, Eye, EyeOff, XCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import KaiaLogo from '../../components/common/KaiaLogo';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

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
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 h-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`flex-1 rounded-full ${i <= strength ? colors[strength] : 'bg-brand-gray-200'} transition-all`} />
        ))}
      </div>
      <span className={`text-[10px] font-bold ${strength === 4 ? 'text-emerald-600' : 'text-brand-gray-500'}`}>
        {labels[strength]}
      </span>
    </div>
  );
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useContext(AuthContext);

  // Receives email and resetToken (short-lived JWT) from VerifyOtp page state
  const { email = '', resetToken = '', verified = false } = location.state || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // If user lands here without going through OTP verification, redirect to forgot-password
  useEffect(() => {
    if (!email || !verified || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, verified, resetToken, navigate]);

  const confirmPasswordError = confirmPassword && password !== confirmPassword
    ? 'Passwords do not match.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!PASSWORD_REGEX.test(password)) {
      return setError('Password must be at least 8 characters and include one uppercase letter, one lowercase letter, and one number.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await resetPassword(email, resetToken, password, confirmPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please restart the process.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-center space-y-6 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />

          <div className="inline-flex p-3 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">Password Reset Complete</h1>
            <p className="text-xs text-brand-gray-500 mt-2 leading-relaxed">
              Your security credentials have been updated. You can now sign in with your new password.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm transition-colors text-center"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-left space-y-8">

        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />
          <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase pt-2">Create New Password</h1>
          <p className="text-xs text-brand-gray-500">
            Setting a new password for: <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="rp-password" className="text-xs font-semibold text-brand-gray-655">New Password:</label>
            <div className="relative">
              <input
                id="rp-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-12 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
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
            <label htmlFor="rp-confirm" className="text-xs font-semibold text-brand-gray-655">Confirm New Password:</label>
            <div className="relative">
              <input
                id="rp-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-brand-light border pl-10 pr-12 py-2.5 rounded-sm text-sm focus:outline-none ${
                  confirmPasswordError ? 'border-red-400' : 'border-brand-gray-250 focus:border-brand-accent'
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
                <XCircle className="w-3 h-3" />
                <span>{confirmPasswordError}</span>
              </p>
            )}
            {confirmPassword && !confirmPasswordError && (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Passwords match.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!confirmPasswordError}
            className="w-full bg-brand-dark hover:bg-brand-gray-850 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-sm text-sm transition-colors"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;
