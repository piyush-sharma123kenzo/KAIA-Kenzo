import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent } from 'lucide-react';
import Container from '../ui/Container';

const PromoBanner = () => {
  return (
    <section className="py-8 text-left bg-brand-light">
      <Container>
        <div className="bg-brand-dark text-white rounded-sm p-8 md:p-12 relative overflow-hidden border border-brand-gray-800 shadow-premiumDark grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Subtle decoration vector glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-bl-full pointer-events-none" />

          <div className="md:col-span-8 space-y-4">
            <span className="inline-block text-[9px] font-bold tracking-wider text-brand-accent uppercase bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded">
              Corporate Payout Procurement
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Buy for Business. Claim GST input Tax credit.</h2>
            <p className="text-brand-gray-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Claim up to 18% on office hardware assets, servers, premium laptops, and accessories. Submit your corporate GSTIN during checkout to generate automatic compliance billing.
            </p>
          </div>
          
          <div className="md:col-span-4 flex md:justify-end">
            <Link
              to="/account?tab=gst"
              className="bg-brand-accent hover:bg-brand-accentHover text-white py-3 px-8 text-xs font-bold uppercase tracking-wider rounded-sm transition-all w-full md:w-auto text-center"
            >
              Configure GST profile
            </Link>
          </div>

        </div>
      </Container>
    </section>
  );
};

export default PromoBanner;
