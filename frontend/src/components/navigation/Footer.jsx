import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headphones, Landmark } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brand-dark border-t border-brand-gray-850 text-brand-gray-300 pt-16 pb-8">
      
      {/* Top trust flags footer header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-brand-gray-850 text-xs">
        <div className="flex items-center space-x-3.5 bg-brand-surface border border-brand-gray-800 p-4 rounded-sm">
          <ShieldCheck className="w-6 h-6 text-brand-accent shrink-0" />
          <div className="text-left">
            <h4 className="font-extrabold text-white">Genuine Brand Stock Only</h4>
            <p className="text-[10px] text-brand-gray-400 mt-0.5">Sourced directly from authorized warehouses with seals.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3.5 bg-brand-surface border border-brand-gray-800 p-4 rounded-sm">
          <Truck className="w-6 h-6 text-brand-accent shrink-0" />
          <div className="text-left">
            <h4 className="font-extrabold text-white">Split Shipment Delivery</h4>
            <p className="text-[10px] text-brand-gray-400 mt-0.5">Split checkouts route from individual brand operators directly.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5 bg-brand-surface border border-brand-gray-800 p-4 rounded-sm">
          <Headphones className="w-6 h-6 text-brand-accent shrink-0" />
          <div className="text-left">
            <h4 className="font-extrabold text-white">Brand Warranty Mapped</h4>
            <p className="text-[10px] text-brand-gray-400 mt-0.5">Warranties sync automatically in customer dashboards.</p>
          </div>
        </div>
      </div>

      {/* Main Directory Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-brand-gray-850">
        
        {/* Brand statement */}
        <div className="col-span-2 space-y-4 text-left">
          <Link to="/" className="flex flex-col items-start select-none">
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              KAIA<span className="text-brand-accent">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-gray-400 mt-1">
              TECHNOLOGIES
            </span>
          </Link>
          <p className="text-xs text-brand-gray-400 max-w-xs leading-relaxed">
            "Technology from Every Brand. One Powerful Marketplace."
          </p>
          <p className="text-[10px] text-brand-gray-500 max-w-xs leading-relaxed">
            KAIA is an enterprise multi-brand B2C/B2B marketplace selling certified hardware components, server assets, and consumer computers from authorized global brands.
          </p>
        </div>

        {/* Categories */}
        <div className="text-left space-y-4">
          <h4 className="text-white font-extrabold text-[10px] uppercase tracking-wider">Shop Categories</h4>
          <ul className="space-y-2 text-xs text-brand-gray-400">
            <li><Link to="/products?category=laptops" className="hover:text-brand-accent transition-colors">Premium Laptops</Link></li>
            <li><Link to="/products?category=smartphones" className="hover:text-brand-accent transition-colors">Smartphones</Link></li>
            <li><Link to="/products?category=audio-and-sound" className="hover:text-brand-accent transition-colors">Sound & Audio</Link></li>
            <li><Link to="/products" className="hover:text-brand-accent transition-colors">Hardware Components</Link></li>
          </ul>
        </div>

        {/* Brands */}
        <div className="text-left space-y-4">
          <h4 className="text-white font-extrabold text-[10px] uppercase tracking-wider">Verified Brands</h4>
          <ul className="space-y-2 text-xs text-brand-gray-400">
            <li><Link to="/products?brand=apple" className="hover:text-brand-accent transition-colors">Apple Inc.</Link></li>
            <li><Link to="/products?brand=asus" className="hover:text-brand-accent transition-colors">ASUS Republic of Gamers</Link></li>
            <li><Link to="/products?brand=samsung" className="hover:text-brand-accent transition-colors">Samsung Electronics</Link></li>
            <li><Link to="/products" className="hover:text-brand-accent transition-colors">Show All Partner Hubs</Link></li>
          </ul>
        </div>

        {/* Platform Compliance */}
        <div className="text-left space-y-4">
          <h4 className="text-white font-extrabold text-[10px] uppercase tracking-wider">Platform Hub</h4>
          <ul className="space-y-2 text-xs text-brand-gray-400">
            <li><Link to="/account?tab=gst" className="hover:text-brand-accent transition-colors font-medium text-brand-accent">GST Corporate Profile</Link></li>
            <li><Link to="/brand/register" className="hover:text-brand-accent transition-colors">Brand Partner Portal</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-accent transition-colors">Compliance Rules</Link></li>
            <li><Link to="/" className="hover:text-brand-accent transition-colors">Warranty Registry</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-brand-gray-500 font-bold uppercase tracking-wider">
        <p>© {new Date().getFullYear()} KAIA Technologies Private Limited. All Rights Reserved.</p>
        <p className="mt-2 md:mt-0">Technology from Every Brand. One Powerful Marketplace.</p>
      </div>

    </footer>
  );
};

export default Footer;
