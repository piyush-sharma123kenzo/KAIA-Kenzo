import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { user, register, error, clearError } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear errors initially
  useEffect(() => {
    clearError();
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/account');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!acceptTerms) {
      setValidationError('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    // Password strength check (Min 8 chars, upper, lower, number)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, 'CUSTOMER', phone);
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-left space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="flex flex-col items-center select-none">
            <span className="text-2xl font-extrabold tracking-tight text-brand-gray-900 leading-none">
              KAIA<span className="text-brand-accent">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium text-brand-gray-500 mt-1">
              TECHNOLOGIES
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-brand-gray-950 tracking-tight pt-2">Create Customer Account</h2>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-655">Full Name:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Piyush Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-655">Email Address:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="piyush@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-655">Mobile Phone:</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-655">Security Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-10 py-2.5 rounded-sm text-sm"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-455" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3.5 text-brand-gray-400 hover:text-brand-gray-600 focus:outline-none"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              <p className="text-[9px] text-brand-gray-450 leading-relaxed pt-1">
                Must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number.
              </p>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start space-x-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded text-brand-accent focus:ring-brand-accent w-4 h-4 mt-0.5"
              />
              <span className="text-[10px] text-brand-gray-500 font-semibold leading-relaxed">
                I agree to the Terms & Conditions and Privacy Policy.
              </span>
            </label>

            {validationError && (
              <p className="text-[10px] text-red-500 font-bold">{validationError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Submitting Registration...' : 'Create Account'}</span>
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
