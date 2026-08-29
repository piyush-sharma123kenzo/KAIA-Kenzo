import React, { useState, useEffect } from 'react';
import { DollarSign, Landmark, ArrowUpRight, TrendingUp } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Sales = () => {
  const [ledger, setLedger] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/seller');
        if (res.data.success) {
          setMetrics(res.data.metrics);
        }

        // We can query the admin-like commissions or a specific seller ledger endpoint.
        // Wait, does the backend have a custom seller payout list?
        // Let's check backend/routes/adminRoutes.js: `/api/admin/commissions` lists ledger.
        // But for brand seller, can they list their own payouts?
        // Let's check backend/controllers/dashboardController.js:
        // Inside getBrandDashboardStats, it populated activeOrders.
        // We can easily fetch all child orders and render the payout ledger list directly in React!
        // Each child order has finalAmount (gross), commissionAmount (platform share), and finalAmount - commissionAmount (net seller payout).
        // This is perfectly accurate, clean, and requires no additional API routes!
        const orderRes = await axiosInstance.get('/orders/seller/my-orders');
        if (orderRes.data.success) {
          // Filter where parent is paid (valid sales only)
          const paidSplits = orderRes.data.orders.filter(
            (o) => o.parentOrder && o.parentOrder.paymentStatus === 'Paid'
          );
          setLedger(paidSplits);
        }
      } catch (err) {
        console.error('Error fetching sales ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading financial ledger...</div>;
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Overview Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Sales Ledger & settlements</h2>
        <p className="text-xs text-brand-gray-500">Monitor your gross hardware revenues, commission offsets, and bank settlement payout status.</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-brand-gray-250 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">Gross Sales GMV</p>
            <h3 className="text-xl font-black text-brand-gray-900">₹{metrics?.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-blue-50 text-blue-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-brand-gray-255 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">KAIA Marketplace Comm. (Est.)</p>
            <h3 className="text-xl font-black text-brand-gray-900">₹{metrics?.totalCommissions.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-red-50 text-red-500 shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-brand-gray-255 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">Net Bank Payout</p>
            <h3 className="text-xl font-black text-brand-accent">₹{metrics?.netPayout.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-green-50 text-green-600 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
          <thead className="bg-brand-gray-50 uppercase tracking-wider font-semibold text-brand-gray-500">
            <tr>
              <th className="px-6 py-4">Transaction Date</th>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Gross Revenue</th>
              <th className="px-6 py-4">Platform Comm. Rate</th>
              <th className="px-6 py-4">Commission Deducted</th>
              <th className="px-6 py-4">Net Payout Ledger</th>
              <th className="px-6 py-4">Payout Status</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-700">
            {ledger.map((row) => {
              const netPayout = row.finalAmount - row.commissionAmount;
              return (
                <tr key={row._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4 font-semibold">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-brand-gray-950">{row.orderId}</td>
                  <td className="px-6 py-4 font-semibold text-brand-gray-900">₹{row.finalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">{row.commissionRate}%</td>
                  <td className="px-6 py-4 text-red-500 font-semibold">- ₹{row.commissionAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-brand-accent font-extrabold">₹{netPayout.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      row.payoutStatus === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                    }`}>
                      {row.payoutStatus === 'Paid' ? 'Settled' : 'Ledgered'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Sales;
