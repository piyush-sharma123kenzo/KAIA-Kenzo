import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldAlert, CheckCircle2, ArrowRight, Send } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const [sentResult, setSentResult] = useState(null);

  useEffect(() => { clearError(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return setError('Please enter your registered email address.');

    setLoading(true);
    try {
      const res = await forgotPassword(trimmedEmail);
      setSentResult(res);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToOtp = () => {
    navigate('/verify-otp', {
      state: {
        email: email.trim().toLowerCase(),
        purpose: 'PASSWORD_RESET',
        devOtp: sentResult?.devOtp,
      },
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-left space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex flex-col items-center select-none">
            <span className="text-2xl font-extrabold tracking-tight text-brand-gray-900 leading-none">
              KAIA
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-brand-gray-500 mt-1">
              TECHNOLOGIES
            </span>
          </Link>
          <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase pt-2">Reset Password</h1>
          <p className="text-xs text-brand-gray-500 leading-relaxed">
            Enter your registered email to receive a 6-digit security verification code.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {sent ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-sm flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Check Your Inbox</p>
                <p className="text-[11px] text-emerald-600 mt-1 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a 6-digit password reset code has been dispatched to that address.
                </p>
              </div>
            </div>

            <button
              onClick={handleContinueToOtp}
              className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Enter Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSent(false)}
              className="w-full text-xs text-brand-gray-500 hover:text-brand-accent font-semibold py-2 transition-colors"
            >
              Use a different email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="fp-email" className="text-xs font-semibold text-brand-gray-650">
                Registered Email Address:
              </label>
              <div className="relative">
                <input
                  id="fp-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark hover:bg-brand-gray-850 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending OTP...' : 'Send Verification Code'}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-brand-gray-100">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs text-brand-accent hover:underline font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
