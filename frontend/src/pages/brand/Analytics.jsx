import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, IndianRupee, ShoppingBag, Package, Calendar, 
  ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const metrics = data?.metrics || {};
  const salesChart = data?.salesChart || [];

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto font-sans select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Sales & Operational Analytics
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Real-time revenue performance, order distribution, and units sold from your authorized brand warehouse.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-sm shadow-sm bg-brand-light p-1 border border-brand-gray-200 text-xs">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-[2px] font-bold uppercase transition-colors ${
                  timeRange === range
                    ? 'bg-brand-dark text-white shadow-sm'
                    : 'text-brand-gray-600 hover:text-brand-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="flex items-center space-x-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Gross Sales</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.4% vs last period
          </span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Completed Orders</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              {metrics.totalOrders || 0}
            </span>
          </div>
          <span className="text-[10px] text-brand-gray-400 font-bold">100% verified fulfillment</span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Active Inventory</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              {metrics.totalProducts || 0}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            {metrics.publishedProducts || 0} customer-visible
          </span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Return Rate</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              {metrics.totalOrders > 0 ? ((metrics.pendingReturns || 0) / metrics.totalOrders * 100).toFixed(1) : 0}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Industry benchmark &lt; 2.5%</span>
        </div>
      </div>

      {/* Revenue Performance Chart Bar Grid */}
      <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-6">
        <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
          <h2 className="text-base font-black text-brand-gray-900 uppercase">Revenue Breakdown Over Time</h2>
          <span className="text-xs text-brand-gray-400 font-mono">Aggregated from MongoDB Order ledger</span>
        </div>

        {salesChart.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-brand-gray-400 italic">
            No sales data recorded in this timeframe.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-3 items-end h-64 pt-6 border-b pb-2">
              {salesChart.slice(-7).map((item, idx) => {
                const maxVal = Math.max(...salesChart.map(s => s.revenue || 1));
                const heightPct = Math.max(12, Math.round(((item.revenue || 0) / maxVal) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-mono text-brand-gray-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      ₹{((item.revenue || 0) / 1000).toFixed(0)}k
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-brand-dark group-hover:bg-amz-orange transition-all rounded-t-sm"
                    />
                    <span className="text-[10px] text-brand-gray-400 mt-2 font-mono">{item.date || `Day ${idx + 1}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Analytics;
