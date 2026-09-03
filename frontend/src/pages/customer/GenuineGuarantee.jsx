import React from 'react';
import { 
  ShieldCheck, Award, FileText, CheckCircle2, Lock, 
  PackageCheck, Sparkles, Building2, ArrowRight 
} from 'lucide-react';
import Container from '../../components/ui/Container';

const PILLARS = [
  {
    icon: Building2,
    title: '100% Authorized OEM Sourcing',
    desc: 'Every product listed on KAIA is sourced exclusively from official brand manufacturer hubs or authorized national distributors. Zero grey-market or refurbished inventory.',
  },
  {
    icon: Lock,
    title: 'Factory Sealed with Tamper Proofing',
    desc: 'Products arrive in original brand packaging with untouched manufacturer holographic seals, protected further by KAIA tamper-evident security tape.',
  },
  {
    icon: Award,
    title: 'Serialized Hardware Tracking',
    desc: 'Every motherboard, laptop, processor, and peripheral serial number is captured in our database at dispatch and mapped to its OEM warranty registry.',
  },
  {
    icon: FileText,
    title: 'Official GST Tax Invoicing',
    desc: 'Every purchase includes a formal GST tax invoice with full HSN code breakdowns, accepted by all authorized brand service centers across India.',
  },
  {
    icon: PackageCheck,
    title: '7-Day Direct DOA Replacement',
    desc: 'If a component arrives physically defective or dead-on-arrival, we provide rapid verification and replacement directly through our fulfillment network.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Manufacturer Warranty',
    desc: 'Enjoy authentic 1 to 5-year OEM warranty coverage supported at all official brand service centers nationwide.',
  },
];

const GenuineGuarantee = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO HEADER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-5xl relative z-10 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest mx-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticity & Quality Commitment</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            The KAIA Genuine Product Guarantee
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            We operate with zero tolerance for counterfeit or unauthorized hardware. Every unit delivered to your doorstep is 100% authentic, brand-new, and fully covered under valid manufacturer warranty.
          </p>
        </Container>
      </section>

      {/* 2. PILLARS GRID */}
      <Container className="max-w-6xl py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-900 text-base">{pillar.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3. VERIFICATION CALLOUT */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Instant Serial Verification</span>
            </div>
            <h3 className="text-xl font-black text-white">Have a serial number to verify?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use our public hardware registry tool to instantly verify your unit's coverage status and purchase details.
            </p>
          </div>

          <a
            href="/warranty-verification"
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 px-6 rounded-xl flex items-center space-x-2 transition-all shadow-sm"
          >
            <span>Verify Warranty Online</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </Container>

    </div>
  );
};

export default GenuineGuarantee;
