import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, ShieldAlert, Package, ArrowUpRight } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axiosInstance.get('/dashboard/seller');
        if (res.data.success) {
          setMetrics(res.data.metrics);
          setChartData(res.data.chartData);
          setProducts(res.data.productStats.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching brand dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading dashboard analytics...</div>;
  }

  const cards = [
    { name: 'Total Revenue', value: `₹${metrics?.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { name: 'Net Payouts', value: `₹${metrics?.netPayout.toLocaleString()}`, icon: DollarSign, color: 'text-brand-accent bg-brand-accent/5' },
    { name: 'Incoming Orders', value: metrics?.totalOrders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { name: 'Low Stock Alerts', value: metrics?.lowStockItems, icon: Package, color: metrics?.lowStockItems > 0 ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-600 bg-gray-50' },
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-black text-brand-gray-900">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-sm ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sales Chart */}
        <div className="lg:col-span-8 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <h3 className="font-extrabold text-sm text-brand-gray-950 uppercase tracking-wider">Revenue Operations</h3>
          <div className="h-80 w-full text-xs">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-brand-gray-400 italic">No sales logs recorded this month.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Panel */}
        <div className="lg:col-span-4 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-extrabold text-sm text-brand-gray-950 uppercase tracking-wider">Product Inventory</h3>
            <Link to="/brand/inventory" className="text-xs text-brand-accent hover:underline flex items-center">
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y text-xs text-brand-gray-650">
            {products.length === 0 ? (
              <p className="py-4 text-center text-brand-gray-450 italic">No products listed.</p>
            ) : (
              products.map((p, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center">
                  <div className="max-w-[200px]">
                    <p className="font-bold text-brand-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">SKU: {p.SKU}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      p.qty <= 3 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700'
                    }`}>
                      {p.qty} Qty
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
