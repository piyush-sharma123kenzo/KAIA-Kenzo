import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, CheckCircle2, AlertTriangle, Clock, Truck, CheckCheck, 
  IndianRupee, TrendingUp, Calendar, ArrowRight, Eye, PlusCircle, 
  ShoppingBag, ShieldAlert, ArrowUpRight, Boxes, BarChart3, ChevronRight,
  Layers, RefreshCw
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const Dashboard = () => {
  const location = useLocation();
  const basePath = location.pathname.startsWith('/vendor') ? '/vendor' : '/brand';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError('Unable to load dashboard data. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-2xl text-center max-w-md mx-auto space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Dashboard Offline</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors inline-flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Dashboard</span>
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];

  const financialCards = [
    {
      title: 'Total Revenue',
      value: `₹${(metrics.totalRevenue || metrics.totalSales || 0).toLocaleString('en-IN')}`,
      sub: `${metrics.totalUnitsSold || 0} units sold`,
      icon: IndianRupee,
      link: `${basePath}/earnings`,
      accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      title: 'Pending Settlement',
      value: `₹${(metrics.pendingSettlement || 0).toLocaleString('en-IN')}`,
      sub: 'Next payout cycle',
      icon: Calendar,
      link: `${basePath}/settlements`,
      accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    {
      title: 'Available Balance',
      value: `₹${(metrics.availableBalance || 0).toLocaleString('en-IN')}`,
      sub: `Paid to date: ₹${(metrics.paidSettlements || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      link: `${basePath}/settlements`,
      accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
  ];

  const inventoryCards = [
    {
      title: 'Total Products',
      value: metrics.totalProducts || 0,
      sub: 'All listed items',
      icon: Package,
      link: `${basePath}/products`,
      badgeColor: 'text-slate-300 bg-slate-800/80',
    },
    {
      title: 'Active in Store',
      value: metrics.activeProducts || metrics.publishedProducts || 0,
      sub: 'Live on marketplace',
      icon: CheckCircle2,
      link: `${basePath}/products?status=Approved`,
      badgeColor: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Drafts',
      value: metrics.draftProducts || 0,
      sub: 'Unpublished',
      icon: Clock,
      link: `${basePath}/products?status=Draft`,
      badgeColor: 'text-amber-400 bg-amber-500/10',
    },
    {
      title: 'Low Stock',
      value: metrics.lowStockProducts || 0,
      sub: 'Needs attention',
      icon: AlertTriangle,
      link: `${basePath}/inventory?lowStockOnly=true`,
      badgeColor: metrics.lowStockProducts > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800/60',
    },
    {
      title: 'Out of Stock',
      value: metrics.outOfStockProducts || 0,
      sub: 'Restock required',
      icon: ShieldAlert,
      link: `${basePath}/inventory?outOfStock=true`,
      badgeColor: metrics.outOfStockProducts > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-slate-800/60',
    },
  ];

  const orderPipeline = [
    { title: 'Total Orders', value: metrics.totalOrders || 0, icon: ShoppingBag, link: `${basePath}/orders`, color: 'text-slate-200' },
    { title: 'Pending', value: metrics.pendingOrders || 0, icon: Clock, link: `${basePath}/orders?status=Pending`, color: 'text-amber-400' },
    { title: 'Processing', value: metrics.processingOrders || 0, icon: Package, link: `${basePath}/fulfillment`, color: 'text-purple-400' },
    { title: 'Shipped', value: metrics.shippedOrders || 0, icon: Truck, link: `${basePath}/shipments`, color: 'text-blue-400' },
    { title: 'Delivered', value: metrics.deliveredOrders || 0, icon: CheckCheck, link: `${basePath}/orders?status=Delivered`, color: 'text-emerald-400' },
    { title: 'Returned', value: metrics.returnedOrders || 0, icon: AlertTriangle, link: `${basePath}/returns`, color: 'text-rose-400' },
  ];

  const salesPeriods = [
    { label: "Today's Sales", value: `₹${(metrics.todaySales || 0).toLocaleString('en-IN')}` },
    { label: 'This Week', value: `₹${(metrics.weekSales || 0).toLocaleString('en-IN')}` },
    { label: 'This Month', value: `₹${(metrics.monthSales || 0).toLocaleString('en-IN')}` },
    { label: 'Average Order Value', value: `₹${(metrics.averageOrderValue || 0).toLocaleString('en-IN')}` },
  ];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {data?.brand?.name || 'Partner'} Dashboard
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {data?.brand?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live inventory synchronization, order fulfillment, and settlement tracking
            </p>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <Link to={`${basePath}/products/new`} className="flex-1 sm:flex-initial">
              <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/15 transition-all flex items-center justify-center space-x-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </Link>
            <Link to={`${basePath}/orders`} className="flex-1 sm:flex-initial">
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-700 transition-colors">
                Manage Orders
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Primary Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {financialCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{card.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl border ${card.accentBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">{card.sub}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Catalog & Inventory Status */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog & Inventory</h3>
          <Link to={`${basePath}/inventory`} className="text-xs text-amber-400 hover:underline font-medium">
            Manage Inventory
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {inventoryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={i}
                to={card.link}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <div className={`p-1.5 rounded-lg ${card.badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Orders & Fulfillment Pipeline */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment Pipeline</h3>
          <Link to={`${basePath}/orders`} className="text-xs text-amber-400 hover:underline font-medium">
            All Orders
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {orderPipeline.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link
                key={i}
                to={card.link}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-2xl shadow-md transition-all group text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <div className="mt-2 text-xl font-bold text-white">{card.value}</div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Sales Performance Strip */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800/80">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sales Velocity</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {salesPeriods.map((period, i) => (
            <div key={i} className={`space-y-1 ${i > 0 ? 'md:pl-6 pt-3 md:pt-0' : ''}`}>
              <p className="text-[11px] font-medium text-slate-400">{period.label}</p>
              <p className="text-lg font-bold text-white">{period.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Recent Orders Table */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800/90 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Orders</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest customer orders for fulfillment</p>
          </div>
          <Link to={`${basePath}/orders`} className="text-xs font-semibold text-amber-400 hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No recent orders received yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-amber-400">
                      {order.orderId}
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="font-medium text-white truncate">
                        {order.items[0]?.name || 'Item'}
                      </p>
                      {order.items.length > 1 && (
                        <span className="text-[10px] text-slate-400">
                          +{order.items.length - 1} more
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {order.customerCity || 'India'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-right text-white">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link to={`${basePath}/orders/${order._id}`}>
                        <button className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors" title="View Order">
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
