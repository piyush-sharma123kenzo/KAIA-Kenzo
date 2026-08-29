import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import Container from '../ui/Container';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Standard regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Success state
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="py-20 bg-brand-dark text-white text-left overflow-hidden relative select-none">
      
      {/* Decorative background vectors */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-tl-full pointer-events-none" />

      <Container className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        
        <div className="space-y-2">
          <span className="text-[9px] font-bold tracking-widest text-brand-accent uppercase">
            Platform Updates
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Stay Ahead of What's Next</h2>
          <p className="text-brand-gray-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Get notified on verified partner launches, B2B hardware updates, and monthly tech deals directly.
          </p>
        </div>

        {submitted ? (
          <div className="bg-brand-surface border border-brand-gray-800 p-6 rounded-sm max-w-md mx-auto flex items-center justify-center space-x-3 text-xs text-green-400 animate-fade-in font-bold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Success: Welcome to the KAIA Technologies registry!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your corporate email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-surface border border-brand-gray-800 text-white placeholder-brand-gray-500 text-xs p-3 rounded-sm focus:border-brand-accent focus:ring-0"
              />
              <Button
                type="submit"
                variant="primary"
                className="bg-brand-accent hover:bg-brand-accentHover text-xs font-bold uppercase tracking-wider px-6 flex items-center space-x-1 border-none"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            {errorMsg && <p className="text-[10px] text-red-500 text-center font-semibold">{errorMsg}</p>}
          </form>
        )}

      </Container>
    </section>
  );
};

export default NewsletterSection;
