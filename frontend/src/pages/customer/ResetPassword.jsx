import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setErrorMsg('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    // Success sandbox
    setSubmitted(true);
  };

  return (
    <Container className="py-16 text-left select-none">
      <div className="max-w-md mx-auto bg-white p-8 border border-brand-gray-250 rounded-sm shadow-premium space-y-6">
        
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">Update Password</h1>
          <p className="text-xs text-brand-gray-500">
            Specify a new security credential for your account.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-sm flex items-start space-x-2.5">
              <CheckCircle className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
              <div>
                <p className="font-extrabold">Password Reset Successful</p>
                <p className="text-[10px] text-green-600 mt-1 leading-relaxed">
                  Your security credentials have been updated. You can now sign in with your new password.
                </p>
              </div>
            </div>
            
            <Link to="/login" className="block text-center">
              <Button variant="primary" className="w-full text-xs font-bold uppercase tracking-wider">
                Proceed to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm flex items-start space-x-2">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-red-650 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-brand-gray-655">New Password:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-brand-gray-655">Confirm New Password:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full text-xs font-bold uppercase tracking-wider">
              Reset Password
            </Button>
          </form>
        )}

      </div>
    </Container>
  );
};

export default ResetPassword;
