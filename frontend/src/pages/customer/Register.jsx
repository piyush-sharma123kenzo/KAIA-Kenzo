import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Phone, ArrowRight, ShieldAlert, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import KaiaLogo from '../../components/common/KaiaLogo';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';

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
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {[1,2,3,4].map(i => (
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
  const { user, register, error, clearError } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { clearError(); }, []);
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'BRAND') navigate('/brand/dashboard');
      else navigate('/account');
    }
  }, [user, navigate]);

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) clearError();
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) return setValidationError('Full name is required.');
    if (!email.trim()) return setValidationError('Email address is required.');

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
      const result = await register(name.trim(), email.trim(), password, confirmPassword, 'CUSTOMER', phone.trim());
      if (result?.requiresVerification) {
        navigate('/verify-otp', {
          state: {
            email: result.email,
            purpose: 'SIGNUP_VERIFICATION',
            devOtp: result.devOtp,
          },
        });
      } else if (result?.user) {
        navigate('/account');
      }
    } catch (err) {
      // Error is displayed via context error state
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

        {/* Error notification */}
        {(error || validationError) && (
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

          {/* Terms */}
          <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="rounded text-brand-accent focus:ring-brand-accent w-4 h-4 mt-0.5 shrink-0"
            />
            <span className="text-[10px] text-brand-gray-500 font-semibold leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-brand-accent hover:underline">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-brand-accent hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !!confirmPasswordError}
            className="w-full bg-brand-dark hover:bg-brand-gray-850 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account & Send OTP'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-brand-gray-100 text-xs text-brand-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-accent font-semibold hover:underline">
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
