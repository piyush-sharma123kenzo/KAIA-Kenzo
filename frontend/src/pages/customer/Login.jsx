import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import KaiaLogo from '../../components/common/KaiaLogo';
import GoogleAuthButton from '../../components/auth/GoogleAuthButton';
import ClerkAuthButton from '../../components/auth/ClerkAuthButton';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, error, clearError } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clear errors when navigating to this page
  useEffect(() => {
    clearError();
  }, []);

  // Redirect if already logged in based on verified database role
  useEffect(() => {
    if (user) {
      const targetRedirect = searchParams.get('redirect');
      const userRole = (user.role || '').toUpperCase();
      if (userRole === 'ADMIN') {
        if (targetRedirect && targetRedirect.startsWith('/admin')) {
          navigate(targetRedirect);
        } else {
          navigate('/admin/dashboard');
        }
      } else if (userRole === 'BRAND' || userRole === 'VENDOR') {
        if (targetRedirect && targetRedirect.startsWith('/brand')) {
          navigate(targetRedirect);
        } else {
          navigate('/brand/dashboard');
        }
      } else {
        if (targetRedirect && !targetRedirect.startsWith('/admin') && !targetRedirect.startsWith('/brand')) {
          navigate(targetRedirect);
        } else {
          navigate('/account');
        }
      }
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, selectedRole);
    } catch (err) {
      // Handle unverified account — redirect to OTP page
      if (err.requiresVerification && err.email) {
        navigate('/verify-otp', {
          state: { email: err.email, purpose: 'SIGNUP_VERIFICATION' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-250 text-left space-y-7">
        
        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />
          <h2 className="text-xl font-extrabold text-brand-gray-950 tracking-tight pt-2">Sign In to Your Workspace</h2>
          <p className="text-xs text-brand-gray-500">Select your account role to continue</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-brand-light p-1 rounded-sm border border-brand-gray-200">
          {[
            { id: 'USER', label: 'Customer', badge: 'USER' },
            { id: 'VENDOR', label: 'Vendor', badge: 'BRAND' },
            { id: 'ADMIN', label: 'Admin', badge: 'ROOT' },
          ].map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  if (error) clearError();
                }}
                className={`py-2 px-1 text-center rounded-sm text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand-dark text-white shadow-sm'
                    : 'text-brand-gray-600 hover:text-brand-gray-900 hover:bg-white/60'
                }`}
              >
                <div>{r.label}</div>
                <div className={`text-[9px] font-mono tracking-wider opacity-80 ${isSelected ? 'text-brand-accent' : 'text-brand-gray-400'}`}>
                  {r.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Social / SSO Auth Options (for normal customer logins) */}
        {selectedRole === 'USER' && (
          <div className="space-y-3">
            <ClerkAuthButton mode="signIn" text="Sign in with Clerk" />
            <GoogleAuthButton text="Continue with Google" mode="login" />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or with email
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Email Address:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={selectedRole === 'ADMIN' ? 'admin@kaia.tech' : selectedRole === 'VENDOR' ? 'brand@company.com' : 'name@company.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-brand-gray-650">Security Password:</label>
                <Link to="/forgot-password" className="text-xs text-brand-accent hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 pl-10 pr-10 py-2.5 rounded-sm text-sm focus:outline-none focus:border-brand-accent"
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-brand-gray-100 flex flex-col space-y-2 text-xs text-brand-gray-500">
          <p>
            New customer?{' '}
            <Link to="/register" className="text-brand-accent font-semibold hover:underline">
              Create customer account
            </Link>
          </p>
          <p>
            Brand Operator?{' '}
            <Link to="/brand/register" className="text-brand-accent font-semibold hover:underline">
              Register as Vendor
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
