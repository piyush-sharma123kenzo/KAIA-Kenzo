import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, CheckCircle2, AlertTriangle, Clock, Truck, CheckCheck, 
  IndianRupee, TrendingUp, Calendar, ArrowRight, Eye, PlusCircle, 
  ShoppingBag, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await brandSellerService.getDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Error loading brand dashboard:', err);
        setError('Unable to load dashboard data. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-left">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-3">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-7 w-3/4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white border border-brand-gray-200 p-6 rounded-sm space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-4 bg-white border border-brand-gray-200 p-6 rounded-sm space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-brand-gray-200 p-12 rounded-sm text-center max-w-lg mx-auto space-y-4 shadow-premium">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-base font-black text-brand-gray-900 uppercase">Dashboard Unavailable</h3>
        <p className="text-xs text-brand-gray-500">{error}</p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const salesChart = data?.salesChart || [];
  const recentOrders = data?.recentOrders || [];

  // Primary Catalog & Order Metric Cards
  const statCards = [
    {
      title: 'Total Products',
      value: metrics.totalProducts || 0,
      sub: `${metrics.publishedProducts || 0} published`,
      icon: Package,
      link: '/brand/products',
      color: 'text-brand-gray-900 bg-brand-light',
    },
    {
      title: 'Published Catalog',
      value: metrics.publishedProducts || 0,
      sub: `${metrics.pendingProducts || 0} pending review`,
      icon: CheckCircle2,
      link: '/brand/products?status=Approved',
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: 'Low Stock Alerts',
      value: metrics.lowStockProducts || 0,
      sub: metrics.lowStockProducts > 0 ? 'Restock immediately' : 'Inventory healthy',
      icon: AlertTriangle,
      link: '/brand/inventory?lowStockOnly=true',
      color: metrics.lowStockProducts > 0 ? 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse' : 'text-brand-gray-700 bg-brand-light',
    },
    {
      title: 'Total Gross Sales',
      value: `₹${(metrics.totalSales || 0).toLocaleString('en-IN')}`,
      sub: `${metrics.totalUnitsSold || 0} units fulfilled`,
      icon: IndianRupee,
      link: '/brand/sales',
      color: 'text-brand-accent bg-brand-accent/5',
    },
  ];

  const orderStatusCards = [
    { title: 'Pending / Processing', value: metrics.pendingOrders || 0, icon: Clock, color: 'text-amber-700 bg-amber-50' },
    { title: 'Packed & Ready', value: metrics.packedOrders || 0, icon: Package, color: 'text-blue-700 bg-blue-50' },
    { title: 'Dispatched / In-Transit', value: metrics.shippedOrders || 0, icon: Truck, color: 'text-indigo-700 bg-indigo-50' },
    { title: 'Delivered Orders', value: metrics.deliveredOrders || 0, icon: CheckCheck, color: 'text-emerald-700 bg-emerald-50' },
  ];

  const salesPeriods = [
    { label: "Today's Sales", value: `₹${(metrics.todaySales || 0).toLocaleString('en-IN')}` },
    { label: 'This Week', value: `₹${(metrics.weekSales || 0).toLocaleString('en-IN')}` },
    { label: 'This Month', value: `₹${(metrics.monthSales || 0).toLocaleString('en-IN')}` },
    { label: 'Average Order Value', value: `₹${(metrics.averageOrderValue || 0).toLocaleString('en-IN')}` },
  ];

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto">
      
      {/* 1. Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-dark text-white p-6 rounded-sm border border-brand-gray-850 shadow-premiumDark">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {data?.brand?.name} Seller Operations
            </h2>
            <Badge variant="success" className="text-[9px] uppercase font-bold tracking-wider">
              {data?.brand?.status || 'Approved'}
            </Badge>
          </div>
          <p className="text-xs text-brand-gray-400">
            Real-time fulfillment metrics, synchronized catalog telemetry, and private order pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/brand/products/new">
            <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </Button>
          </Link>
          <Link to="/brand/orders">
            <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider text-white border-brand-gray-700 hover:bg-brand-surface">
              Manage Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="bg-white border border-brand-gray-200 hover:border-brand-accent p-5 rounded-sm shadow-premium flex flex-col justify-between transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-brand-gray-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-black text-brand-gray-900 tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-sm ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-gray-100 flex justify-between items-center text-[10px]">
                <span className="font-semibold text-brand-gray-500">{card.sub}</span>
                <ArrowRight className="w-3 h-3 text-brand-gray-400 group-hover:text-brand-accent transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Sales Breakdown Strip */}
      <div className="bg-white border border-brand-gray-200 rounded-sm p-5 shadow-premium">
        <h4 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-accent" />
          <span>Sales Velocity & Performance</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-brand-gray-200">
          {salesPeriods.map((period, i) => (
            <div key={i} className={`space-y-1 ${i > 0 ? 'md:pl-6 pt-3 md:pt-0' : ''}`}>
              <p className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider">{period.label}</p>
              <p className="text-lg font-black text-brand-gray-900">{period.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Order Status Pipeline Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {orderStatusCards.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex items-center space-x-3.5">
              <div className={`p-2.5 rounded-sm ${item.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider leading-none">{item.title}</p>
                <p className="text-xl font-black text-brand-gray-900 mt-1">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Recent Orders Table */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
        <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">Recent Fulfillment Orders</h3>
            <p className="text-[11px] text-brand-gray-500 mt-0.5">Private dispatch items destined for customer deliveries.</p>
          </div>
          <Link to="/brand/orders" className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-gray-400 italic space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-brand-gray-300" />
            <p>No customer orders received yet for this brand.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-gray-50 border-b border-brand-gray-200 text-brand-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-200 text-brand-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-brand-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-accent">
                      {order.orderId}
                    </td>
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="font-bold text-brand-gray-900 truncate">
                        {order.items[0]?.name || 'Technology Item'}
                      </p>
                      {order.items.length > 1 && (
                        <span className="text-[10px] text-brand-gray-400 font-medium">
                          +{order.items.length - 1} more item(s)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-brand-gray-600">
                      {order.customerCity}
                    </td>
                    <td className="px-5 py-3.5 font-black text-right text-brand-gray-900">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-brand-gray-500 font-medium text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link to={`/brand/orders/${order._id}`}>
                        <button className="text-brand-accent hover:text-brand-dark font-bold text-xs p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
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

export default Dashboard;
