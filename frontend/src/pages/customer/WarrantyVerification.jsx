import React, { useState } from 'react';
import { 
  ShieldCheck, Search, CheckCircle2, XCircle, AlertCircle, 
  Clock, Package, Calendar, Award, ExternalLink, Sparkles 
} from 'lucide-react';
import Container from '../../components/ui/Container';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

const WarrantyVerification = () => {
  const toast = useToast();
  const [serialInput, setSerialInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!serialInput.trim()) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const res = await axiosInstance.get(`/warranties/verify?serialNumber=${encodeURIComponent(serialInput.trim())}`);
      setResult(res.data);
    } catch (err) {
      console.error('[Warranty Verification Error]:', err);
      toast?.error?.('Error connecting to warranty registry. Please try again.');
      setResult({ found: false, message: 'Unable to communicate with warranty verification server.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Coverage</span>
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Warranty Expired</span>
          </span>
        );
      case 'Claimed':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Claim In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            <span>{status || 'Verified Registry'}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-24 text-slate-800">
      
      {/* 1. HERO SEARCH HEADER */}
      <section className="bg-slate-950 text-white py-16 px-4 md:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="max-w-4xl relative z-10 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-widest mx-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official OEM Warranty Registry</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Verify Serial Number & Warranty Status
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Enter your hardware Serial Number or IMEI to verify authentic manufacturer warranty status, coverage start/end dates, and authorized service eligibility.
          </p>

          {/* Search Box */}
          <form onSubmit={handleVerify} className="max-w-2xl mx-auto pt-4">
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center space-x-3 px-3 w-full">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-ASUS-98201X or IMEI..."
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  className="w-full py-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 px-8 rounded-xl shrink-0 transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>{loading ? 'Checking...' : 'Verify Hardware'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Serial numbers can be found on your product chassis barcode label or digital tax invoice.
            </p>
          </form>
        </Container>
      </section>

      {/* 2. RESULTS DISPLAY AREA */}
      <Container className="max-w-4xl py-12">
        {loading && (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Querying authenticated hardware ledger...</p>
          </div>
        )}

        {!loading && searched && result && result.found && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6">
            
            {/* Header Strip */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black">
                  Verified Hardware Record
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {result.data.productName}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Serial Number: <strong className="text-white font-mono">{result.data.serialNumber}</strong>
                </p>
              </div>

              <div className="shrink-0">
                {getStatusBadge(result.data.status)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 sm:p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Authorized Brand</span>
                <p className="font-black text-slate-900 text-sm">{result.data.brandName}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Coverage Duration</span>
                <p className="font-black text-slate-900 text-sm">{result.data.warrantyMonths} Months</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Purchase / Start Date</span>
                <p className="font-bold text-slate-900 text-xs font-mono">
                  {new Date(result.data.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Valid Until</span>
                <p className="font-bold text-slate-900 text-xs font-mono">
                  {new Date(result.data.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Terms Footer */}
            <div className="p-6 sm:p-8 pt-0">
              <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Coverage Scope & Support Policy</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {result.data.terms} For RMA replacement or on-site service requests, submit a support ticket with this Serial Number.
                </p>
              </div>
            </div>

          </div>
        )}

        {!loading && searched && result && !result.found && (
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-red-200/80 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Serial Number Not Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {result.message || 'No active warranty or serial unit was found matching your search. Please verify the characters on your invoice.'}
            </p>
            <div className="pt-2">
              <a
                href="/support"
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
              >
                <span>Contact Support Desk</span>
              </a>
            </div>
          </div>
        )}

        {/* 3. INFORMATION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <h4 className="font-black text-slate-900 text-sm">Where to find Serial Number?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check the underside barcode label on laptops, retail packaging box, or the itemized serial section in your KAIA GST tax invoice.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <h4 className="font-black text-slate-900 text-sm">Authorized OEM Network</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              KAIA warranty records are accepted at all authorized service centers across India for valid manufacturer repair.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
            <h4 className="font-black text-slate-900 text-sm">Zero Private Data Exposure</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verification results display only hardware and warranty validity metadata without exposing customer identities or payment details.
            </p>
          </div>
        </div>

      </Container>

    </div>
  );
};

export default WarrantyVerification;
