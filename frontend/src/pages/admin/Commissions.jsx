import React, { useState, useEffect } from 'react';
import { Landmark, Award, ClipboardList, TrendingUp } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Commissions = () => {
  const [ledger, setLedger] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await axiosInstance.get('/admin/commissions');
        if (res.data.success) {
          setLedger(res.data.ledger);
        }

        const statsRes = await axiosInstance.get('/dashboard/admin');
        if (statsRes.data.success) {
          setMetrics(statsRes.data.metrics);
        }
      } catch (err) {
        console.error('Error fetching admin commissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading commissions ledger...</div>;
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Commissions & Payouts Ledger</h2>
        <p className="text-xs text-brand-gray-500">Real-time logging of parent order transactions, split brand allocations, and platform revenue commissions.</p>
      </div>

      {/* Financial Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-brand-gray-250 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">Gross platform GMV</p>
            <h3 className="text-xl font-black text-brand-gray-900">₹{metrics?.gmv.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-blue-50 text-blue-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-brand-gray-250 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">Net Commission Revenue</p>
            <h3 className="text-xl font-black text-brand-accent">₹{metrics?.commissionRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-red-50 text-red-500 shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-brand-gray-255 p-6 rounded-sm shadow-premium flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-400 uppercase tracking-wider">Total Seller Payouts</p>
            <h3 className="text-xl font-black text-green-600">₹{metrics?.sellerPayouts.toLocaleString()}</h3>
          </div>
          <div className="p-2.5 rounded bg-green-50 text-green-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
          <thead className="bg-brand-gray-50 uppercase tracking-wider font-semibold text-brand-gray-500">
            <tr>
              <th className="px-6 py-4">Transaction Date</th>
              <th className="px-6 py-4">Parent Order Ref</th>
              <th className="px-6 py-4">Seller Brand</th>
              <th className="px-6 py-4">Split Gross (INR)</th>
              <th className="px-6 py-4">Comm. Rate</th>
              <th className="px-6 py-4">Platform Share</th>
              <th className="px-6 py-4">Seller Payable</th>
              <th className="px-6 py-4">Settlement Status</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y text-brand-gray-700">
            {ledger.map((row) => (
              <tr key={row._id} className="hover:bg-brand-gray-50/50">
                <td className="px-6 py-4 font-semibold">
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-bold text-brand-gray-950">
                  {row.orderId?.orderId || 'KAIA-ORD-REST'}
                </td>
                <td className="px-6 py-4 font-bold capitalize text-brand-gray-800">
                  {row.seller?.name}
                </td>
                <td className="px-6 py-4 font-semibold text-brand-gray-900">₹{row.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 font-medium">{row.childOrderId?.commissionRate || 5}%</td>
                <td className="px-6 py-4 text-red-500 font-semibold">- ₹{row.commissionAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-brand-accent font-extrabold">₹{row.netSellerPayout.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    row.payoutStatus === 'Settled' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                  }`}>
                    {row.payoutStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Commissions;
