import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Truck, FileText, CheckCircle2, 
  Send, Layers, ArrowRight, DollarSign, PackageCheck, Headphones,
  Sparkles, BadgeCheck, AlertCircle
} from 'lucide-react';
import Container from '../../components/ui/Container';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

const DirectBrandSupply = () => {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    productRequirement: '',
    quantity: '',
    targetTimeline: 'Within 30 Days',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await axiosInstance.post('/enquiries/direct-supply', {
        ...form,
        quantity: Number(form.quantity),
      });

      setSubmitted(true);
      toast?.success?.('Bulk supply inquiry submitted successfully!');
    } catch (err) {
      console.error('[Direct Supply Error]:', err);
      const msg = err.response?.data?.message || 'Failed to submit inquiry. Please try again.';
      setErrorMsg(msg);
      toast?.error?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO BANNER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 relative overflow-hidden border-b border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-6xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" />
            <span>Enterprise & Institutional Procurement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-3xl">
            Direct Brand Hardware Supply for Enterprises & System Builders.
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            Procure verified OEM laptops, computing components, networking appliances, and peripherals straight from authorized manufacturer depots with 100% genuine serialized warranty and automated GST input tax credit invoicing.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-300">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct OEM Sourced</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-400">
              <FileText className="w-4 h-4" />
              <span>18% - 28% GST Input Credit</span>
            </div>
            <div className="flex items-center space-x-1.5 text-blue-400">
              <Truck className="w-4 h-4" />
              <span>Insured Pan-India Express Transit</span>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. CORE VALUE PILLARS */}
      <Container className="max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Tiered Volume Pricing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent institutional discounts tailored for IT departments, systems integrators, educational labs, and enterprise workstation deployments.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Immutable Serial Allocation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every single component, motherboard, GPU, and laptop unit is digitally mapped to its authorized warranty registry before dispatch.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900 text-base">Dedicated Account Desk</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct access to a procurement specialist for custom configuration sourcing, scheduled batch delivery, and consolidated GST invoicing.
            </p>
          </div>
        </div>
      </Container>

      {/* 3. INQUIRY FORM & HOW IT WORKS */}
      <Container className="max-w-6xl space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: How It Works & SLA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">
                Procurement Workflow
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start space-x-3.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Submit Requirement Details</h4>
                    <p className="text-slate-500 mt-0.5">Specify model SKUs, target volume, and deployment timeline.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900">OEM Depot Verification & Quote</h4>
                    <p className="text-slate-500 mt-0.5">We check live manufacturer inventories and issue an official B2B proforma.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Insured Transit & GST Billing</h4>
                    <p className="text-slate-500 mt-0.5">Dispatch with tamper-evident seals and automatic e-way bill generation.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Enterprise SLA Guarantee</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Direct Supply inquiries are answered by certified procurement specialists within <strong>24 business hours</strong> with official inventory availability statements.
              </p>
            </div>
          </div>

          {/* Right: Interactive Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Request Direct Brand Supply Quote
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below. Our enterprise desk will prepare custom wholesale pricing.
              </p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-black text-emerald-950">Inquiry Successfully Registered!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{form.name}</strong>. Your requirement for <strong>{form.companyName}</strong> has been assigned to an institutional account manager. You will receive an official quotation at <strong>{form.email}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: '',
                        companyName: '',
                        email: '',
                        phone: '',
                        productRequirement: '',
                        quantity: '',
                        targetTimeline: 'Within 30 Days',
                        message: '',
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-800">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700">Company / Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech Solutions Pvt. Ltd."
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-700">Corporate Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700">Direct Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-slate-700">Hardware Requirement / Models *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50x Workstation Laptops (i7, 32GB RAM, RTX)"
                      value={form.productRequirement}
                      onChange={(e) => setForm({ ...form, productRequirement: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700">Estimated Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Units (e.g. 25)"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700">Target Procurement Timeline</label>
                  <select
                    value={form.targetTimeline}
                    onChange={(e) => setForm({ ...form, targetTimeline: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                  >
                    <option value="Immediate (Within 7 Days)">Immediate (Within 7 Days)</option>
                    <option value="Within 30 Days">Within 30 Days</option>
                    <option value="Quarterly Planning (30-90 Days)">Quarterly Planning (30-90 Days)</option>
                    <option value="Annual Rate Contract">Annual Rate Contract (ARC)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700">Additional Specifications / Note (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Include specific delivery locations, GSTIN details, or customization requirements..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs py-3 px-8 rounded-xl shadow-md shadow-amber-500/20 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Submitting Requirement...' : 'Submit Direct Supply Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </Container>

    </div>
  );
};

export default DirectBrandSupply;
