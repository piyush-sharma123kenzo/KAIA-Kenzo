import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, RotateCcw } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    const performVerify = () => {
      if (!token) {
        setStatus('error');
        return;
      }
      // Simulated sandbox verify after 2s
      const timer = setTimeout(() => {
        setStatus('success');
      }, 2000);
      return () => clearTimeout(timer);
    };
    performVerify();
  }, [token]);

  const handleResend = () => {
    setResending(true);
    setResendMsg('');
    setTimeout(() => {
      setResending(false);
      setResendMsg('Verification email resent. Check your inbox.');
    }, 1500);
  };

  return (
    <Container className="py-16 text-left select-none">
      <div className="max-w-md mx-auto bg-white p-8 border border-brand-gray-250 rounded-sm shadow-premium space-y-6 text-center">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="animate-spin h-10 w-10 text-brand-accent mx-auto border-4 border-t-brand-accent border-brand-gray-200 rounded-full" />
            <h1 className="text-lg font-bold text-brand-gray-800">Verifying Email Address...</h1>
            <p className="text-xs text-brand-gray-500">Checking verification token in the system database...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="inline-block p-3 bg-green-50 border border-green-200 rounded-full text-green-700">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">Email Verified</h1>
              <p className="text-xs text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
                Thank you. Your email address has been verified. You can now access all marketplace checkout operations.
              </p>
            </div>
            <Link to="/login" className="block">
              <Button variant="primary" className="w-full text-xs font-bold uppercase">
                Sign In to Account
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="inline-block p-3 bg-red-50 border border-red-200 rounded-full text-red-700">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">Verification Failed</h1>
              <p className="text-xs text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
                The verification link is invalid, expired, or has already been used to confirm your credentials.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending}
                className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{resending ? 'Resending Link...' : 'Resend Verification Email'}</span>
              </Button>
              {resendMsg && <p className="text-[10px] text-green-600 font-semibold">{resendMsg}</p>}
            </div>
          </div>
        )}

      </div>
    </Container>
  );
};

export default VerifyEmail;
