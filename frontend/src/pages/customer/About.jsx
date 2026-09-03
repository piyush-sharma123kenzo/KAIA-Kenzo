import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Cpu, Building2, Truck, Award, 
  CheckCircle2, ArrowRight, Sparkles, Layers, FileText 
} from 'lucide-react';
import Container from '../../components/ui/Container';
import KaiaLogo from '../../components/common/KaiaLogo';
import { KAIA_OFFICE_LOCATION } from '../../constants/companyInfo';

const About = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO BANNER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-6xl relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-widest bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-full inline-block">
              Corporate Identity & Multi-Brand Architecture
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              India's Premier Verified Hardware Marketplace.
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-normal leading-relaxed">
              KAIA Technologies operates as the high-performance hardware, direct brand supply, and verified serialized distribution platform of <strong>Kenzo Info Systems Pvt. Ltd.</strong> Delivering 100% authentic electronics with full GST compliance and immutable warranty tracking.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shrink-0 hidden md:block">
            <KaiaLogo variant="full" theme="dark" size="lg" animated={true} />
          </div>
        </Container>
      </section>

      {/* 2. MISSION & VISION */}
      <Container className="max-w-6xl py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-wider">Our Mission</span>
            <h3 className="text-xl font-black text-slate-900">Democratizing Authentic Hardware Sourcing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To eliminate counterfeit products, unverified grey-market warranties, and opaque pricing from the Indian electronics market by establishing direct digital bridges between authorized brand fulfillment hubs and technology consumers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">Our Vision</span>
            <h3 className="text-xl font-black text-slate-900">The Gold Standard for IT Procurement</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To be the most trusted computing infrastructure marketplace in South Asia, powering individual power users, content creators, gaming enthusiasts, and enterprise workstation fleets with transparent SLAs.
            </p>
          </div>
        </div>

        {/* 3. CORE VALUE PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">100% Authorized OEM Sourcing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every laptop, workstation, processor, and peripheral is cataloged and dispatched directly from verified brand hubs with genuine manufacturer warranty.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Enterprise GST Input Credit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seamlessly enter your company GSTIN at checkout to claim 18% to 28% Input Tax Credit with automated multi-seller tax invoice generation.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Serialized Hardware Tracking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every dispatched unit is paired with unique factory serial numbers mapped at the packing workbench, safeguarding warranty claims and swift returns.
            </p>
          </div>
        </div>

        {/* 4. MULTI-BRAND OPERATING ARCHITECTURE */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">
            How KAIA Multi-Brand Architecture Operates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Single Cart, Multi-Depot Splitting</span>
              </h4>
              <p>
                Add ASUS gaming rigs, Dell enterprise workstations, and Logitech peripherals to a single customer cart. When you checkout, KAIA automatically coordinates separate seller fulfillments from each brand's regional warehouse.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Insured Pan-India Logistics</span>
              </h4>
              <p>
                Partnered with premier express logistics carriers including Blue Dart, Delhivery, and DTDC, providing end-to-end milestone tracking and OTP delivery verification.
              </p>
            </div>
          </div>
        </div>

        {/* 5. ACTION CTA */}
        <div className="bg-slate-900 p-8 sm:p-10 rounded-3xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-slate-800">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-xl font-black text-white">Ready to explore authentic computing hardware?</h3>
            <p className="text-xs text-slate-300">Browse thousands of products across verified hardware manufacturers.</p>
          </div>
          <Link to="/catalog">
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 px-8 rounded-xl transition-all shadow-sm flex items-center space-x-2">
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

      </Container>

    </div>
  );
};

export default About;
