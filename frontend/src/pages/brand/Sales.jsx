import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, TrendingUp, ShoppingCart, Package, Calendar, 
  ArrowUpRight, BarChart3, ShieldCheck, CheckCircle2, ShieldAlert
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Sales = () => {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSales = async (selectedRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getSales(selectedRange);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      setError('Unable to calculate sales analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(range);
  }, [range]);

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'All Time', value: 'all' },
  ];

  const analytics = data?.analytics || {};
  const chartData = data?.chartData || [];

  const statCards = [
    {
      label: 'Gross Sales Revenue',
      value: `₹${(analytics.grossSales || 0).toLocaleString('en-IN')}`,
      sub: 'Total customer order volume',
      icon: IndianRupee,
      color: 'text-brand-accent bg-brand-accent/5',
    },
    {
      label: 'Estimated Net Payout',
      value: `₹${(analytics.netSales || 0).toLocaleString('en-IN')}`,
      sub: `After ₹${(analytics.commissionTotal || 0).toLocaleString('en-IN')} platform fees`,
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Orders Fulfilled',
      value: analytics.totalOrders || 0,
      sub: `${analytics.unitsSold || 0} hardware items sold`,
      icon: ShoppingCart,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Average Order Value (AOV)',
      value: `₹${(analytics.averageOrderValue || 0).toLocaleString('en-IN')}`,
      sub: 'Per customer transaction',
      icon: Package,
      color: 'text-brand-gray-900 bg-brand-light',
    },
  ];

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-16">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Sales Analytics & Revenues</h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Real-time gross transaction telemetry, net settlement offsets, and order metrics aggregated directly from MongoDB.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-brand-light p-1 rounded-sm border border-brand-gray-200">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                range === r.value
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'text-brand-gray-600 hover:text-brand-gray-900 hover:bg-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-6 rounded-sm space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-brand-gray-500 uppercase tracking-wider">{card.label}</p>
                    <h3 className="text-2xl font-black text-brand-gray-900 tracking-tight">{card.value}</h3>
                  </div>
                  <div className={`p-2.5 rounded-sm ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] text-brand-gray-400 font-semibold mt-4 pt-3 border-t border-brand-gray-100">
                  {card.sub}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Breakdown Table */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
        <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">Timeline Sales Distribution</h3>
            <p className="text-[11px] text-brand-gray-500 mt-0.5">Periodic performance breakdown across selected window ({range.toUpperCase()}).</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="p-16 text-center text-xs text-brand-gray-400 italic space-y-2">
            <BarChart3 className="w-10 h-10 mx-auto text-brand-gray-300" />
            <p>Sales analytics will appear here once customers purchase your brand products during this timeframe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-6 py-3.5">Activity Date</th>
                  <th className="px-6 py-3.5 text-center">Orders Count</th>
                  <th className="px-6 py-3.5 text-center">Units Sold</th>
                  <th className="px-6 py-3.5 text-right">Gross Sales</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-brand-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-brand-gray-900 font-mono">
                      {row.date}
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-brand-gray-800">
                      {row.orders}
                    </td>
                    <td className="px-6 py-3.5 text-center font-semibold text-brand-gray-600">
                      {row.units}
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-brand-accent">
                      ₹{row.sales.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Sales;
