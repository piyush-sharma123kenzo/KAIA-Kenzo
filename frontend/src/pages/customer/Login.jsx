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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="max-w-md w-full bg-white p-8 sm:p-9 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.06)] border border-slate-200/90 text-left space-y-7">
        
        {/* Header */}
        <div className="text-center space-y-2.5 flex flex-col items-center">
          <KaiaLogo to="/" variant="full" theme="light" size="lg" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-slate-500">
            Select your account type and enter your credentials to continue
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: 'USER', label: 'Customer', sub: 'Shopper' },
            { id: 'VENDOR', label: 'Partner', sub: 'Brand' },
            { id: 'ADMIN', label: 'Admin', sub: 'Control' },
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
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div>{r.label}</div>
                <div className={`text-[10px] ${isSelected ? 'text-amber-400 font-medium' : 'text-slate-400 font-normal'}`}>
                  {r.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Social / SSO Auth Options */}
        <div className="space-y-2.5">
          <GoogleAuthButton
            text="Continue with Google"
            mode="login"
          />
          <ClerkAuthButton
            mode="signIn"
            role={selectedRole}
            text="Continue with Clerk"
          />

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 lowercase">
              or sign in with email
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={selectedRole === 'ADMIN' ? 'admin@kaia.tech' : selectedRole === 'VENDOR' ? 'brand@company.com' : 'name@company.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B400] focus:border-[#F5B400] transition-all text-slate-900"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-12 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B400] focus:border-[#F5B400] transition-all text-slate-900"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F5B400] hover:bg-[#e0a400] text-slate-950 font-extrabold py-3 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99]"
          >
            <span>{loading ? 'Signing in...' : `Sign In`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 flex flex-col space-y-2 text-xs text-slate-500">
          <p>
            New to KAIA?{' '}
            <Link to="/register" className="text-amber-600 font-bold hover:text-amber-700 hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            Brand Seller?{' '}
            <Link to="/brand/register" className="text-amber-600 font-bold hover:text-amber-700 hover:underline">
              Join as a Brand Partner
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
