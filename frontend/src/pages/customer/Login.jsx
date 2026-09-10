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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200/90 text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight pt-1">Sign In to Your Workspace</h2>
          <p className="text-xs text-slate-500">Choose your account type to proceed</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {[
            { id: 'USER', label: 'Customer', badge: 'USER' },
            { id: 'VENDOR', label: 'Vendor', badge: 'VENDOR' },
            { id: 'ADMIN', label: 'Admin', badge: 'ADMIN' },
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
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div>{r.label}</div>
                <div className={`text-[9px] font-mono tracking-wider ${isSelected ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {r.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Single Sign-On / SSO Options (Clerk & Google) */}
        <div className="space-y-2.5">
          <ClerkAuthButton
            mode="signIn"
            role={selectedRole}
            text={
              selectedRole === 'ADMIN'
                ? 'Sign in with Clerk as Admin'
                : selectedRole === 'VENDOR'
                  ? 'Sign in with Clerk as Vendor'
                  : 'Sign in with Clerk'
            }
          />
          {selectedRole !== 'ADMIN' && (
            <GoogleAuthButton
              text={selectedRole === 'VENDOR' ? 'Continue with Google as Vendor' : 'Continue with Google'}
              mode="login"
            />
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or with email & password
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-amber-700 hover:underline font-semibold">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole === 'USER' ? 'Customer' : selectedRole === 'VENDOR' ? 'Vendor' : 'Admin'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 flex flex-col space-y-1.5 text-xs text-slate-500">
          <p>
            New customer?{' '}
            <Link to="/register" className="text-amber-700 font-semibold hover:underline">
              Create customer account
            </Link>
          </p>
          <p>
            Brand Operator?{' '}
            <Link to="/brand/register" className="text-amber-700 font-semibold hover:underline">
              Register as Vendor
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
