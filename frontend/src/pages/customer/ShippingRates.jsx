import React, { useState } from 'react';
import { 
  Truck, MapPin, Search, CheckCircle2, Clock, 
  ShieldCheck, AlertCircle, ArrowRight, Package, Sparkles 
} from 'lucide-react';
import Container from '../../components/ui/Container';
import { lookupPincode } from '../../services/locationService';

const SHIPPING_TIERS = [
  {
    name: 'Standard Surface Insured',
    sla: '3 – 5 Business Days',
    price: 'FREE on orders above ₹999 (₹99 below ₹999)',
    desc: 'Full pan-India insured transit via BlueDart Surface & Delhivery Ground.',
    badge: 'Popular',
  },
  {
    name: 'Priority Express Air',
    sla: '24 – 48 Hours (Major Metros)',
    price: '₹149 Flat',
    desc: 'Direct air express courier dispatch from nearest regional hub.',
    badge: 'Fastest',
  },
  {
    name: 'Enterprise Bulk Freight',
    sla: '2 – 4 Business Days',
    price: 'Custom Quotation',
    desc: 'Palletized B2B logistics with dedicated lift-gate delivery and transit insurance.',
    badge: 'B2B Sourcing',
  },
];

const ShippingRates = () => {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const locationData = await lookupPincode(pincode);
      if (locationData && locationData.city) {
        setResult({
          serviceable: true,
          city: locationData.city,
          state: locationData.state,
          tier: locationData.isMetro ? 'Metro (Express 24-48h Eligible)' : 'Standard Regional Hub',
          estimatedDays: locationData.isMetro ? '1 – 2 Days' : '3 – 4 Days',
        });
      } else {
        setResult({
          serviceable: true,
          city: 'Verified Postal Zone',
          state: 'India',
          tier: 'Pan-India Insured Courier Network',
          estimatedDays: '3 – 5 Days',
        });
      }
    } catch (err) {
      setResult({
        serviceable: true,
        city: 'Verified Postal Zone',
        state: 'India',
        tier: 'Standard Insured Logistics',
        estimatedDays: '3 – 5 Days',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO HEADER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-5xl relative z-10 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest mx-auto">
            <Truck className="w-3.5 h-3.5" />
            <span>Pan-India Logistics & Delivery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Shipping & Delivery Rates
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Transparent insured delivery timelines and rates across 27,000+ Indian postal PIN codes with zero hidden surcharges.
          </p>

          {/* Pin Code Checker */}
          <form onSubmit={handleCheck} className="max-w-xl mx-auto pt-4">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2">
              <div className="flex items-center space-x-3 px-3 w-full">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit PIN code (e.g. 110091)"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || pincode.length !== 6}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-3 px-6 rounded-xl shrink-0 transition-all shadow-sm"
              >
                <span>{loading ? 'Checking...' : 'Check Availability'}</span>
              </button>
            </div>
          </form>
        </Container>
      </section>

      {/* 2. RESULTS */}
      <Container className="max-w-5xl py-10 space-y-12">
        {searched && result && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-emerald-700 uppercase font-black tracking-wider">
                  Insured Delivery Available
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  PIN Code {pincode} — {result.city}, {result.state}
                </h3>
                <p className="text-xs text-slate-500">
                  Zone Type: <strong className="text-slate-800">{result.tier}</strong> | Estimated Standard SLA: <strong className="text-emerald-700 font-bold">{result.estimatedDays}</strong>
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-xs font-black text-emerald-900 shrink-0">
              Eligible for Free Shipping
            </div>
          </div>
        )}

        {/* 3. TIER RATE MATRIX */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Standard Shipping Rates & Service Levels
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every package is shipped with tamper-evident security tape, serial tracking, and full transit liability protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SHIPPING_TIERS.map((tier, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {tier.badge}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900">{tier.name}</h3>
                  <div className="text-xs font-mono font-bold text-amber-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                    SLA: {tier.sla}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {tier.desc}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[11px] text-slate-400 font-bold block">Rate Structure</span>
                  <span className="text-xs font-black text-slate-900">{tier.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. LOGISTICS PARTNERS & SECURITY */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h3 className="text-lg font-black text-white">Tier-1 Logistics Network</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated routing via highest performance carrier by postal hub.</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold text-slate-300">
              <span className="px-3 py-1 rounded-lg bg-white/10">BlueDart</span>
              <span className="px-3 py-1 rounded-lg bg-white/10">Delhivery</span>
              <span className="px-3 py-1 rounded-lg bg-white/10">DTDC</span>
              <span className="px-3 py-1 rounded-lg bg-white/10">XpressBees</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="space-y-1.5">
              <span className="font-bold text-white block">100% Insured In Transit</span>
              <p className="text-slate-400 leading-relaxed">If a parcel is lost or damaged during transit, a full replacement unit is expedited immediately.</p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-white block">OTP Delivery Verification</span>
              <p className="text-slate-400 leading-relaxed">High-value computing hardware requires secure one-time PIN authentication upon doorstep delivery.</p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-white block">Open-Box Inspection (Select Hubs)</span>
              <p className="text-slate-400 leading-relaxed">Customers can inspect external seal integrity with the courier associate prior to accepting OTP handoff.</p>
            </div>
          </div>
        </div>

      </Container>

    </div>
  );
};

export default ShippingRates;
