import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Landmark, Users2, Building2, Package, ShieldCheck, ArrowRight, BarChart } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/admin');
        if (res.data.success) {
          setMetrics(res.data.metrics);
          setChartData(res.data.chartData);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading admin operations console...</div>;
  }

  const kpis = [
    { name: 'Gross Merchandise Volume (GMV)', value: `₹${metrics?.gmv.toLocaleString()}`, icon: Landmark, color: 'text-green-600 bg-green-50' },
    { name: 'Platform Commission Revenue', value: `₹${metrics?.commissionRevenue.toLocaleString()}`, icon: BarChart, color: 'text-brand-accent bg-brand-accent/5' },
    { name: 'Seller Payouts Ledger', value: `₹${metrics?.sellerPayouts.toLocaleString()}`, icon: Landmark, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Registered Users', value: metrics?.totalUsers, icon: Users2, color: 'text-gray-600 bg-gray-50' },
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">{kpi.name}</p>
                <h3 className="text-xl font-black text-brand-gray-900">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-sm ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification alerts & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Verification Alert Center */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
            <h3 className="font-extrabold text-xs text-brand-gray-955 uppercase tracking-wider border-b pb-2">Verification Desk</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-orange-50 border border-orange-200 p-4 rounded-sm">
                <div>
                  <p className="font-bold text-orange-850">Brand Applications</p>
                  <p className="text-[10px] text-orange-700 mt-0.5">{metrics?.pendingBrands} submissions pending</p>
                </div>
                <Link to="/admin/brands" className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider text-[9px]">
                  Verify
                </Link>
              </div>

              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-4 rounded-sm">
                <div>
                  <p className="font-bold text-blue-800">Product listings</p>
                  <p className="text-[10px] text-blue-650 mt-0.5">{metrics?.pendingProducts} submissions pending</p>
                </div>
                <Link to="/admin/products" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider text-[9px]">
                  Verify
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Global Sales Line Chart */}
        <div className="lg:col-span-8 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <h3 className="font-extrabold text-xs text-brand-gray-955 uppercase tracking-wider">Marketplace Gross & Revenue Charts</h3>
          <div className="h-80 w-full text-xs">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-brand-gray-400 italic">No sales transactions processed yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line name="Gross GMV" type="monotone" dataKey="gmv" stroke="#2563EB" strokeWidth={3} />
                  <Line name="Comm. Revenue" type="monotone" dataKey="revenue" stroke="#E11D48" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
