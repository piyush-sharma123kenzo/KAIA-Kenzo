import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, ShieldCheck, CheckCircle2, AlertCircle, Clock, 
  Search, ExternalLink, QrCode, Building2, Package, ArrowRight,
  HelpCircle, Sparkles, FileText
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const Warranty = () => {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchSerial, setSearchSerial] = useState('');
  const [claimingId, setClaimingId] = useState(null);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const fetchWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/warranties');
      if (res.data?.success) {
        setWarranties(res.data.warranties || []);
      }
    } catch (err) {
      console.error('Error loading warranties:', err);
      setError('Unable to retrieve warranty registry records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const handleClaimWarranty = async (warrantyId) => {
    setClaimingId(warrantyId);
    setActionMsg({ type: '', text: '' });
    try {
      const res = await axiosInstance.post(`/warranties/${warrantyId}/claim`);
      if (res.data?.success) {
        setActionMsg({
          type: 'success',
          text: 'Warranty service ticket submitted. Our authorized brand support desk will contact you within 24 hours.',
        });
        fetchWarranties();
      }
    } catch (err) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Error processing warranty claim request.',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const filteredWarranties = searchSerial.trim()
    ? warranties.filter(
        (w) =>
          w.serialNumber?.toLowerCase().includes(searchSerial.toLowerCase().trim()) ||
          w.product?.name?.toLowerCase().includes(searchSerial.toLowerCase().trim()) ||
          w.brand?.name?.toLowerCase().includes(searchSerial.toLowerCase().trim())
      )
    : warranties;

  return (
    <Container className="py-10 space-y-8 text-left max-w-6xl font-sans pb-24">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <Award className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
              Hardware Warranty Registry
            </h1>
          </div>
          <p className="text-xs text-brand-gray-500 mt-1">
            Official manufacturer and authorized seller digital warranty certificates with serial barcode verification.
          </p>
        </div>

        <Link to="/warranty-policy">
          <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider">
            Warranty Policy & Terms
          </Button>
        </Link>
      </div>

      {/* 2. Notification Message */}
      {actionMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-2.5 ${
          actionMsg.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {actionMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 3. Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-brand-gray-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-brand-gray-400 shrink-0" />
        <input
          type="text"
          value={searchSerial}
          onChange={(e) => setSearchSerial(e.target.value)}
          placeholder="Filter warranties by Serial Number, Product Name, or Brand..."
          className="w-full text-xs bg-transparent border-none focus:outline-none placeholder:text-brand-gray-400 text-brand-gray-900 font-medium"
        />
        {searchSerial && (
          <button
            onClick={() => setSearchSerial('')}
            className="text-xs text-brand-gray-400 hover:text-brand-gray-700 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* 4. Warranty Certificates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredWarranties.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 rounded-2xl p-16 text-center space-y-4 shadow-xs">
          <Award className="w-14 h-14 text-brand-gray-300 mx-auto" />
          <h2 className="text-lg font-black text-brand-gray-900 uppercase">
            {searchSerial ? 'No Matching Warranty Found' : 'No Active Warranties Found'}
          </h2>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            {searchSerial
              ? `No warranty certificate matched "${searchSerial}".`
              : 'Digital warranty certificates are automatically activated and cataloged when your electronics orders are delivered.'}
          </p>
          <Link to="/products">
            <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider mt-2">
              Browse Electronics
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWarranties.map((w) => {
            const isExpired = w.status === 'Expired' || new Date() > new Date(w.endDate);
            const isClaimed = w.status === 'Claimed';
            const isActive = !isExpired && !isClaimed && w.status === 'Active';

            return (
              <div 
                key={w._id} 
                className="bg-white rounded-2xl border border-brand-gray-200 shadow-xs p-6 flex flex-col justify-between space-y-5 hover:border-amber-400 transition-all"
              >
                {/* Top: Brand, Product & Status */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-gray-100 flex items-center justify-center font-bold text-xs text-brand-gray-800">
                        {w.brand?.name?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider block">
                          {w.brand?.name || 'Authorized Brand'}
                        </span>
                        <p className="font-extrabold text-sm text-brand-gray-900 line-clamp-1">
                          {w.product?.name || 'Hardware Unit'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isClaimed
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {isActive ? '● Active' : isClaimed ? '◷ Claim Under Review' : '✕ Expired'}
                    </span>
                  </div>

                  {/* Serial Barcode Info */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">Assigned Serial / IMEI</span>
                      <span className="font-extrabold text-slate-900">{w.serialNumber}</span>
                    </div>
                    <QrCode className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Middle: Duration & Dates */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-brand-gray-100 py-3">
                  <div>
                    <span className="text-[10px] text-brand-gray-400 font-bold block">Start Date</span>
                    <span className="font-bold text-brand-gray-800">
                      {w.startDate ? new Date(w.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-gray-400 font-bold block">Coverage Expiry</span>
                    <span className="font-bold text-brand-gray-800">
                      {w.endDate ? new Date(w.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Bottom: Claim Action */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-brand-gray-500 font-medium">
                    {w.warrantyMonths || 12} Months Manufacturer Coverage
                  </span>

                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClaimWarranty(w._id)}
                      disabled={claimingId === w._id}
                      className="text-xs uppercase font-bold"
                    >
                      {claimingId === w._id ? 'Submitting Claim...' : 'File Service Claim'}
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </Container>
  );
};

export default Warranty;
