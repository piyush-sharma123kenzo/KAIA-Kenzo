import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, ShieldCheck, MapPin, ExternalLink, Building2, 
  Mail, Phone, Clock, Compass, Navigation 
} from 'lucide-react';
import { KAIA_OFFICE_LOCATION } from '../../constants/companyInfo';

const Footer = () => {
  const [mapLoaded, setMapLoaded] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full font-sans text-xs select-none">
      
      {/* ========================================================================= */}
      {/* 1. BACK TO TOP FULL-WIDTH BAR (#37475A)                                   */}
      {/* ========================================================================= */}
      <button
        onClick={scrollToTop}
        className="w-full bg-amz-navy3 hover:bg-amz-navy3Hover text-white py-3.5 text-center text-xs font-semibold tracking-wider transition-colors cursor-pointer block"
      >
        Back to top
      </button>

      {/* ========================================================================= */}
      {/* 2. CORPORATE DIRECTORY & VERIFIED OFFICE LOCATION (Navy-2 #232F3E)        */}
      {/* ========================================================================= */}
      <div className="bg-amz-navy2 text-white border-b border-brand-gray-800 py-14 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-left">
          
          {/* Col 1: Get to Know Us */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white tracking-tight">Get to Know Us</h4>
            <ul className="space-y-2 text-brand-gray-300 text-xs">
              <li><Link to="/about" className="hover:underline hover:text-white">About KAIA Technologies</Link></li>
              <li><Link to="/about" className="hover:underline hover:text-white">Direct Brand Supply</Link></li>
              <li><Link to="/categories" className="hover:underline hover:text-white">Hardware Catalog</Link></li>
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
              <li><Link to="/privacy-policy" className="hover:underline hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:underline hover:text-white">Terms of Service</Link></li>
              <li><Link to="/shipping-policy" className="hover:underline hover:text-white">Shipping & Delivery Policy</Link></li>
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
            <div className="flex items-center space-x-2 text-amber-400">
              <Building2 className="w-4 h-4 shrink-0" />
              <h4 className="font-extrabold text-xs tracking-wider uppercase">KAIA Office</h4>
            </div>

            {/* Address Details */}
            <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
              <p className="font-bold text-white text-xs">{KAIA_OFFICE_LOCATION.companyName}</p>
              <p>{KAIA_OFFICE_LOCATION.addressLine1}</p>
              <p>{KAIA_OFFICE_LOCATION.landmark}</p>
              <p>{KAIA_OFFICE_LOCATION.city}, {KAIA_OFFICE_LOCATION.country}</p>
            </div>

            {/* Compact Map Preview Card */}
            <div className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 aspect-[16/9] shadow-inner group">
              {/* Static lightweight map tile with dynamic marker */}
              <iframe
                title="KAIA Technologies Office Location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(KAIA_OFFICE_LOCATION.fullAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0 opacity-80 group-hover:opacity-100 transition-opacity"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
              />
              
              {/* Floating Map Badge */}
              <div className="absolute bottom-1.5 left-1.5 bg-slate-900/90 text-amber-300 px-2 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 backdrop-blur-sm pointer-events-none">
                <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span>Delhi HQ</span>
              </div>
            </div>

            {/* View on Map CTA Button */}
            <a
              href={KAIA_OFFICE_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg shadow transition-all flex items-center justify-center space-x-1.5 group"
            >
              <span>View on Map</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTERED WORDMARK & LOCALE STRIP (Navy #131A22)                       */}
      {/* ========================================================================= */}
      <div className="bg-amz-navy text-white py-6 border-b border-brand-gray-850">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 px-4">
          <Link to="/" className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black tracking-tight text-white leading-none">
              KAIA
            </span>
            <span className="text-xs font-bold text-amz-orange tracking-normal">
              Technologies
            </span>
          </Link>

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

      {/* ========================================================================= */}
      {/* 4. BOTTOM LEGAL STRIP (Darkest Navy #0F1720)                             */}
      {/* ========================================================================= */}
      <div className="bg-amz-navyDark text-brand-gray-400 py-8 px-4 text-center text-[11px] space-y-2">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
          <Link to="/terms" className="hover:underline hover:text-white">Conditions of Use & Sale</Link>
          <Link to="/privacy" className="hover:underline hover:text-white">Privacy Notice</Link>
          <Link to="/seller-policy" className="hover:underline hover:text-white">Seller Policy</Link>
          <Link to="/warranty-policy" className="hover:underline hover:text-white">Warranty Policy</Link>
          <Link to="/shipping-policy" className="hover:underline hover:text-white">Shipping & Logistics</Link>
        </div>
        <p className="text-brand-gray-500">
          © 2026, KAIA Technologies Pvt. Ltd. Mayur Vihar Phase 1, Delhi. All rights reserved.
        </p>
      </div>

    </footer>
  );
};

export default Footer;
