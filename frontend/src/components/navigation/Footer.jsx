import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, ShieldCheck, MapPin, ExternalLink, Building2, 
  Mail, Phone, Clock, Compass, Navigation, Lock, CheckCircle2, RotateCcw
} from 'lucide-react';
import { KAIA_OFFICE_LOCATION } from '../../constants/companyInfo';
import KaiaLogo from '../common/KaiaLogo';

const Footer = ({ mode = 'full' }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // CHECKOUT MINIMAL TRUST FOOTER (Distraction-Free Commerce)
  // =========================================================================
  if (mode === 'checkout') {
    return (
      <footer className="w-full bg-slate-950 text-slate-400 py-8 px-4 text-center text-xs select-none border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Trust Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-semibold text-slate-300">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>256-Bit SSL Bank-Grade Encryption</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Genuine Direct Brand Supply</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>7-Day Replacement Policy</span>
            </div>
          </div>

          {/* Quick Support Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1 text-[11px]">
            <Link to="/help" className="hover:text-amber-400 hover:underline">Help & Support</Link>
            <Link to="/shipping-policy" className="hover:text-amber-400 hover:underline">Shipping Policy</Link>
            <Link to="/refund-policy" className="hover:text-amber-400 hover:underline">Returns & Refunds</Link>
            <Link to="/privacy" className="hover:text-amber-400 hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-amber-400 hover:underline">Terms of Service</Link>
          </div>

          <p className="text-[11px] text-slate-400">
            © 2026 KAIA Technologies Pvt. Ltd. | Powered by{' '}
            <a 
              href="https://www.kenzoinfosystems.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:underline font-semibold"
            >
              Kenzo Info Systems
            </a>
            . Verified Office: Mayur Vihar Phase 1, Delhi, India.
          </p>
        </div>
      </footer>
    );
  }

  // =========================================================================
  // AUTH MINIMAL FOOTER (Login, Register, OTP)
  // =========================================================================
  if (mode === 'auth') {
    return (
      <footer className="w-full bg-slate-900 text-slate-400 py-6 px-4 text-center text-[11px] select-none border-t border-slate-800">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-slate-300">
            <Link to="/terms" className="hover:text-amber-400 hover:underline">Conditions of Use</Link>
            <Link to="/privacy" className="hover:text-amber-400 hover:underline">Privacy Notice</Link>
            <Link to="/help" className="hover:text-amber-400 hover:underline">Help</Link>
            <Link to="/contact" className="hover:text-amber-400 hover:underline">Contact</Link>
          </div>
          <p className="text-slate-400">
            © 2026, KAIA Technologies Pvt. Ltd. |{' '}
            <a 
              href="https://www.kenzoinfosystems.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:underline font-semibold"
            >
              Kenzo Info Systems
            </a>
          </p>
        </div>
      </footer>
    );
  }

  // =========================================================================
  // FULL COMMERCIAL MARKETING FOOTER (Homepage, Catalog, Brands, etc.)
  // =========================================================================
  return (
    <footer className="w-full font-sans text-xs select-none">
      
      {/* 1. BACK TO TOP FULL-WIDTH BAR */}
      <button
        onClick={scrollToTop}
        className="w-full bg-amz-navy3 hover:bg-amz-navy3Hover text-white py-3.5 text-center text-xs font-semibold tracking-wider transition-colors cursor-pointer block"
      >
        Back to top
      </button>

      {/* 2. CORPORATE DIRECTORY & VERIFIED OFFICE LOCATION */}
      <div className="bg-amz-navy2 text-white border-b border-brand-gray-800 py-14 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-left">
          
          {/* Col 1: Get to Know Us */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white tracking-tight">Get to Know Us</h4>
            <ul className="space-y-2 text-brand-gray-300 text-xs">
              <li><Link to="/about" className="hover:underline hover:text-white">About KAIA Technologies</Link></li>
              <li>
                <a 
                  href="https://www.kenzoinfosystems.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:underline hover:text-amber-400 inline-flex items-center space-x-1 font-bold text-amber-300"
                >
                  <span>Kenzo Info Systems</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><Link to="/about" className="hover:underline hover:text-white">Direct Brand Supply</Link></li>
              <li><Link to="/categories" className="hover:underline hover:text-white">Hardware Catalog</Link></li>
              <li><Link to="/compare" className="hover:underline hover:text-amber-400">Product Comparison</Link></li>
              <li><Link to="/about" className="hover:underline hover:text-white">Warranty Verification</Link></li>
            </ul>
          </div>

          {/* Col 2: Connect with Us */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white tracking-tight">Connect with Us</h4>
            <ul className="space-y-2 text-brand-gray-300 text-xs">
              <li><Link to="/contact" className="hover:underline hover:text-white">Customer Support</Link></li>
              <li><Link to="/help" className="hover:underline hover:text-white">Help Assistant</Link></li>
              <li><Link to="/brands" className="hover:underline hover:text-white">Authorized Brand Directory</Link></li>
              <li><a href="mailto:support@kaia.tech" className="hover:underline hover:text-white">support@kaia.tech</a></li>
            </ul>
          </div>

          {/* Col 3: Policies & Security */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white tracking-tight">Policies & Trust</h4>
            <ul className="space-y-2 text-brand-gray-300 text-xs">
              <li><Link to="/privacy" className="hover:underline hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:underline hover:text-white">Terms of Service</Link></li>
              <li><Link to="/shipping-policy" className="hover:underline hover:text-white">Shipping & Delivery Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:underline hover:text-white">Refund & Return Policy</Link></li>
              <li><Link to="/about" className="hover:underline hover:text-white">Genuine Product Guarantee</Link></li>
            </ul>
          </div>

          {/* Col 4: Let Us Help You */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white tracking-tight">Let Us Help You</h4>
            <ul className="space-y-2 text-brand-gray-300 text-xs">
              <li><Link to="/account" className="hover:underline hover:text-white">Your Account</Link></li>
              <li><Link to="/orders" className="hover:underline hover:text-white">Returns & RMA Claims</Link></li>
              <li><Link to="/account?tab=warranties" className="hover:underline hover:text-white">Serial Warranty Check</Link></li>
              <li><Link to="/shipping-policy" className="hover:underline hover:text-white">Shipping & Delivery Rates</Link></li>
            </ul>
          </div>

          {/* Col 5: KAIA TECHNOLOGIES OFFICE & VERIFIED MAP LOCATION */}
          <div className="lg:col-span-1 space-y-3.5 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-amz-orange shrink-0" />
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Corporate Hub</h4>
            </div>

            <div className="text-[11px] text-brand-gray-300 leading-relaxed space-y-1">
              <strong className="text-white block font-bold">KAIA Technologies Pvt. Ltd.</strong>
              <p>Mayur Vihar Phase 1, Near Unna Enclave<br />Delhi, India</p>
              
              <a
                href="https://www.kenzoinfosystems.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline pt-1"
              >
                <span>www.kenzoinfosystems.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="h-24 w-full rounded-lg overflow-hidden border border-slate-700 relative bg-slate-800">
              <iframe
                title="KAIA Technologies Verified Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14013.298064971274!2d77.2917!3d28.6056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce4c16a1ebc5d%3A0x8e57849156488d5e!2sMayur%20Vihar%20Phase%201%2C%20Delhi!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Mayur+Vihar+Phase+1+near+Unna+Enclave+Delhi+India"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-bold group"
            >
              <span>View on Map</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

        </div>
      </div>

      {/* 3. CENTERED WORDMARK & LOCALE STRIP */}
      <div className="bg-amz-navy text-white py-6 border-b border-brand-gray-850">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <KaiaLogo
            to="/"
            variant="full"
            theme="dark"
            size="md"
            className="hover:opacity-90 transition-opacity"
          />

          <div className="flex items-center space-x-3 text-xs text-brand-gray-300">
            <div className="border border-brand-gray-600 rounded-[3px] px-3 py-1.5 flex items-center space-x-1.5 hover:border-white cursor-pointer">
              <Globe className="w-3.5 h-3.5" />
              <span>English</span>
            </div>
            <div className="border border-brand-gray-600 rounded-[3px] px-3 py-1.5 flex items-center space-x-1.5 hover:border-white cursor-pointer">
              <span>🇮🇳 India (INR)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM LEGAL STRIP */}
      <div className="bg-amz-navyDark text-brand-gray-400 py-8 px-4 text-center text-[11px] space-y-2">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
          <Link to="/terms" className="hover:underline hover:text-white">Conditions of Use & Sale</Link>
          <Link to="/privacy" className="hover:underline hover:text-white">Privacy Notice</Link>
          <Link to="/seller-policy" className="hover:underline hover:text-white">Seller Policy</Link>
          <Link to="/warranty-policy" className="hover:underline hover:text-white">Warranty Policy</Link>
          <Link to="/shipping-policy" className="hover:underline hover:text-white">Shipping & Logistics</Link>
        </div>
        <p className="text-brand-gray-400">
          © 2026, KAIA Technologies Pvt. Ltd. | Powered by{' '}
          <a 
            href="https://www.kenzoinfosystems.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-amber-400 hover:text-amber-300 hover:underline font-bold"
          >
            Kenzo Info Systems Pvt. Ltd.
          </a>
          . Mayur Vihar Phase 1, Delhi. All rights reserved.
        </p>
      </div>

    </footer>
  );
};

export default Footer;
