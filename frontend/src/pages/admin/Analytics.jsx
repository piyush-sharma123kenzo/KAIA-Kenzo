import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, PieChart, ShoppingBag, 
  Landmark, DollarSign, Layers, Building2, Calendar, 
  ArrowUpRight, ArrowDownRight, RefreshCw, FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Button from '../../components/ui/Button';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminDashboard(timeRange);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-20 font-sans">
      
      {/* 1. Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Deep Analytics & Financial Intelligence
          </h1>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Aggregated order volumes, platform commission yield, category distributions, and partner performance matrices.
          </p>
        </div>

        {/* Time filters */}
        <div className="flex items-center space-x-1 bg-white border border-brand-gray-200 p-1 rounded-sm shadow-sm text-xs font-bold">
          {[
            { key: 'today', label: 'Today' },
            { key: '7days', label: '7 Days' },
            { key: '30days', label: '30 Days' },
            { key: '3months', label: '3 Months' },
            { key: '6months', label: '6 Months' },
            { key: '1year', label: '1 Year' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeRange(t.key)}
              className={`px-3 py-1 rounded transition-colors ${
                timeRange === t.key
                  ? 'bg-brand-dark text-white'
                  : 'text-brand-gray-600 hover:text-brand-gray-900 hover:bg-brand-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Gross Revenue (GMV)</span>
            <p className="text-2xl font-black text-brand-gray-900 mt-1">₹{Number(kpis.totalGMV || 0).toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Real-time DB aggregate</span>
          </div>

          <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Platform Commission</span>
            <p className="text-2xl font-black text-indigo-700 mt-1">₹{Number(kpis.marketplaceCommission || 0).toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-brand-gray-500 font-mono block mt-1">Yield: ~{kpis.totalGMV ? Math.round((kpis.marketplaceCommission / kpis.totalGMV) * 100) : 5}%</span>
          </div>

          <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Total Dispatched Orders</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{kpis.totalOrders || 0}</p>
            <span className="text-[10px] text-brand-gray-500 font-mono block mt-1">Master orders completed</span>
          </div>

          <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Refund & Return Deductions</span>
            <p className="text-2xl font-black text-red-600 mt-1">₹{Number(kpis.totalRefunds || 0).toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-red-500 font-mono block mt-1">Completed refund settlements</span>
          </div>
        </div>
      )}

      {/* 3. Category Breakdown & Brand GMV Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance */}
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
            <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">
              Hardware Category Revenue Breakdown
            </h3>
            <Link to="/admin/categories" className="text-xs text-brand-accent font-bold hover:underline">
              Categories
            </Link>
          </div>

          <div className="space-y-4 text-xs">
            {data?.salesByCategory?.map((cat, idx) => {
              const maxRev = data.salesByCategory[0]?.revenue || 1;
              const pct = Math.round((cat.revenue / maxRev) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-bold text-brand-gray-900">
                    <span>{cat._id || 'Hardware'} ({cat.unitsSold} units)</span>
                    <span className="font-mono font-black">₹{cat.revenue?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full h-2 bg-brand-gray-100 rounded overflow-hidden">
                    <div className="h-full bg-brand-accent rounded" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Leaderboard */}
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
            <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">
              Brand Partner Throughput & Yield
            </h3>
            <Link to="/admin/brands" className="text-xs text-brand-accent font-bold hover:underline">
              Brands
            </Link>
          </div>

          <div className="divide-y divide-brand-gray-100 text-xs">
            {data?.salesByBrand?.map((b, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-brand-gray-900">{b.brandName}</p>
                  <span className="text-[10px] text-brand-gray-500 font-mono">{b.orders} orders • Comm: ₹{b.commission?.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right font-mono">
                  <p className="font-black text-indigo-700 text-sm">₹{b.gmv?.toLocaleString('en-IN')}</p>
                  {b.refunds > 0 && <span className="text-[9px] text-red-500">Refunds: -₹{b.refunds?.toLocaleString('en-IN')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
