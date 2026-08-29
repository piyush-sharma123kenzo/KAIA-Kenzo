import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <Container className="py-16 text-left select-none">
      <div className="max-w-md mx-auto bg-white p-8 border border-brand-gray-250 rounded-sm shadow-premium space-y-6">
        
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-extrabold text-brand-gray-900 tracking-tight uppercase">Reset Your Password</h1>
          <p className="text-xs text-brand-gray-500 leading-relaxed">
            Enter your registered email address to receive a secure recovery verification link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-sm flex items-start space-x-2.5">
              <CheckCircle className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
              <div>
                <p className="font-extrabold">Recovery Email Dispatched (Sandbox)</p>
                <p className="text-[10px] text-green-600 mt-1 leading-relaxed">
                  A reset token has been registered in the database for <strong>{email}</strong>.
                </p>
              </div>
            </div>
            
            <Link to="/login" className="block text-center">
              <Button variant="primary" className="w-full text-xs font-bold uppercase tracking-wider">
                Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-brand-gray-650">Email Address:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-light border-brand-gray-250 pl-10 pr-4 py-2.5 rounded-sm text-sm"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-gray-450" />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full text-xs font-bold uppercase tracking-wider">
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="text-center pt-4 border-t">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-brand-accent hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </Container>
  );
};

export default ForgotPassword;
