import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection = () => {
  return (
    <section className="relative bg-brand-dark overflow-hidden py-24 md:py-32 px-6 border-b border-brand-gray-850 select-none">
      
      {/* Background radial soft ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-accent/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left message column */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-brand-accent uppercase bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded">
            Authorized Multi-Brand Marketplace
          </span>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Technology from Every Brand.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-indigo-400">
              One Powerful Marketplace.
            </span>
          </h1>
          
          <p className="text-brand-gray-400 text-sm md:text-base max-w-xl leading-relaxed">
            Discover genuine laptops, premium smartphones, PC components, and enterprise servers from leading global manufacturers — all mapped to official brand warranty claims and business GSTIN invoicing.
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link to="/products">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto bg-brand-accent border-brand-accent hover:bg-brand-accentHover text-xs tracking-wider uppercase font-bold"
              >
                Explore Products
              </Button>
            </Link>
            
            <Link to="/brands">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-brand-gray-700 hover:border-white text-white text-xs tracking-wider uppercase font-bold"
              >
                Explore Brands
              </Button>
            </Link>
          </div>
        </div>

        {/* Right graphic column */}
        <div className="lg:col-span-5 relative hidden lg:block text-left">
          <div className="aspect-square bg-brand-surface border border-brand-gray-800 rounded-sm p-8 shadow-premiumDark flex flex-col justify-between relative overflow-hidden group hover:border-brand-gray-700 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            
            <div className="flex justify-between items-start">
              <Cpu className="w-12 h-12 text-brand-accent" />
              <span className="text-[9px] font-bold tracking-wider text-brand-gray-500 uppercase px-2.5 py-1 rounded bg-brand-dark border border-brand-gray-850">
                Enterprise Certified
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider block">Unified Ecosystem</span>
              <h3 className="text-xl font-bold text-white leading-snug">
                Powering professional operations, computing networks, and digital workspaces.
              </h3>
            </div>

            <div className="pt-6 border-t border-brand-gray-850 flex justify-between text-[10px] text-brand-gray-400 font-bold uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-brand-accent" />
                <span>Verified Stock Only</span>
              </span>
              <span>100% Genuine</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
