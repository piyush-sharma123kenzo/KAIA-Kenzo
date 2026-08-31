import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Landmark, CreditCard, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw, PlusCircle, X, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminRevenue = () => {
  const [revenue, setRevenue] = useState({
    gmv: 0,
    platformCommission: 0,
    commissionTax: 0,
    totalRefunds: 0,
    netMarketplaceRevenue: 0,
    sellerPayables: 0,
    pendingSettlements: 0,
    paidSettlements: 0,
    orderCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Manual Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [brands, setBrands] = useState([]);
  const [adjustForm, setAdjustForm] = useState({
    brandId: '',
    amount: '',
    type: 'credit',
    reason: '',
  });
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const [revRes, brandRes] = await Promise.all([
        brandSellerService.getAdminRevenue(),
        brandSellerService.getAdminSettlements(),
      ]);

      if (revRes.success) setRevenue(revRes);
    } catch (err) {
      console.error('Error fetching admin revenue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.brandId || !adjustForm.amount || !adjustForm.reason.trim()) {
      alert('Please fill out all adjustment fields.');
      return;
    }

    setSubmittingAdj(true);
    try {
      const res = await brandSellerService.createAdjustment(adjustForm);
      if (res.success) {
        alert('Manual adjustment posted to seller ledger.');
        setShowAdjustModal(false);
        setAdjustForm({ brandId: '', amount: '', type: 'credit', reason: '' });
        fetchRevenueData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting adjustment.');
    } finally {
      setSubmittingAdj(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Revenue & Financial Analytics
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Platform GMV, commission take-rates, seller liability ledger, and settlement disbursements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/admin/commissions">
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider">
              Commission Rules
            </Button>
          </Link>
          <Link to="/admin/settlements">
            <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider">
              Settlement Control Station
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Primary Revenue KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Gross Merchandise Value (GMV)', val: revenue.gmv, color: 'text-brand-gray-900', desc: `${revenue.orderCount} paid orders` },
          { label: 'KAIA Commission Take-Rate', val: revenue.platformCommission, color: 'text-indigo-700', desc: 'Platform service revenue' },
          { label: 'Total Refund Deductions', val: revenue.totalRefunds, color: 'text-red-600', desc: 'Returned customer goods' },
          { label: 'Net Marketplace Revenue', val: revenue.netMarketplaceRevenue, color: 'text-emerald-700', desc: 'Net platform earnings' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-1">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-2xl font-black ${kpi.color}`}>
              ₹{Number(kpi.val || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-brand-gray-500 font-medium pt-1">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. Secondary Seller Liabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase">Seller Payables Liability</span>
            <Landmark className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-xl font-black text-brand-gray-900">
            ₹{Number(revenue.sellerPayables || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-brand-gray-500">Gross sales minus marketplace commission fees.</p>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase">Pending Settlement Statements</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-600">
            ₹{Number(revenue.pendingSettlements || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-brand-gray-500">Awaiting admin review and payout disbursement.</p>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase">Disbursed to Brand Accounts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">
            ₹{Number(revenue.paidSettlements || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-brand-gray-500">Completed payouts via payment partner.</p>
        </div>
      </div>

    </div>
  );
};

export default AdminRevenue;
