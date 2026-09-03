import React from 'react';
import { 
  Building2, Globe, ExternalLink, ShieldCheck, 
  Cpu, Server, Network, Sparkles, CheckCircle2, ArrowRight 
} from 'lucide-react';
import Container from '../../components/ui/Container';
import { KAIA_OFFICE_LOCATION } from '../../constants/companyInfo';

const KenzoInfoSystems = () => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO HEADER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-5xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" />
            <span>Corporate Information & Group Profile</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-3xl">
            Kenzo Info Systems Pvt. Ltd.
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Kenzo Info Systems is a premier enterprise IT infrastructure, enterprise software solutions, and multi-tier technology procurement corporation powering mission-critical systems across India.
          </p>

          <div className="pt-2">
            <a
              href="https://www.kenzoinfosystems.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 px-6 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              <span>Visit Official Corporate Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </Container>
      </section>

      {/* 2. RELATIONSHIP WITH KAIA */}
      <Container className="max-w-5xl py-12 space-y-12">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Corporate Relationship</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Parent Entity of KAIA Technologies
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            KAIA Technologies operates as the dedicated specialized high-performance hardware marketplace, direct brand supply, and serialized warranty distribution venture of <strong>Kenzo Info Systems Pvt. Ltd.</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
              <Server className="w-6 h-6 text-amber-600" />
              <h3 className="font-black text-slate-900 text-sm">Enterprise IT Deployments</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Data center server architecture, HPC clusters, and workstation fleet lifecycle management.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
              <Network className="w-6 h-6 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm">Systems Integration</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                End-to-end cloud infrastructure, networking topology, and enterprise cybersecurity.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-2">
              <Cpu className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-slate-900 text-sm">Supply Chain Engineering</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct OEM brand alliance framework powering KAIA's authenticated marketplace platform.
              </p>
            </div>
          </div>
        </div>

        {/* 3. CORPORATE HEADQUARTERS */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4">
          <h3 className="text-lg font-black text-white">Registered Corporate Office</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>{KAIA_OFFICE_LOCATION.companyName}</strong> (A Kenzo Info Systems Enterprise)<br />
            {KAIA_OFFICE_LOCATION.fullAddress}
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
            <a href="https://www.kenzoinfosystems.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline flex items-center space-x-1">
              <span>www.kenzoinfosystems.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-500">|</span>
            <a href={`mailto:${KAIA_OFFICE_LOCATION.businessEmail}`} className="text-slate-300 hover:text-white">
              {KAIA_OFFICE_LOCATION.businessEmail}
            </a>
          </div>
        </div>
      </Container>

    </div>
  );
};

export default KenzoInfoSystems;
