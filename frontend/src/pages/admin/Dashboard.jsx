import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingBag, Users2, Building2, PackageOpen, 
  Landmark, RotateCcw, AlertTriangle, ArrowUpRight, 
  Layers, CreditCard, Clock, ShieldCheck, Download, ChevronRight, Eye,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Filter, Store, DollarSign,
  ArrowDownRight, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getAdminDashboard(timeRange);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Unable to retrieve dashboard metrics.');
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError('Connection to KAIA central database failed. Please verify backend status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeRange]);

  const kpis = data?.kpis || {};
  const lowStockList = data?.lowStockList || [];
  const salesByCategory = data?.salesByCategory || [];
  const salesByBrand = data?.salesByBrand || [];
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];

  // Calculate total category revenue to render relative percentage bars
  const totalCategoryRevenue = salesByCategory.reduce((sum, c) => sum + (c.revenue || 0), 0) || 1;

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-24 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Title, Subtitle & Segmented Date Range Selector           */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Marketplace Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Live Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time overview of marketplace performance, operations, revenue and inventory.
          </p>
        </div>

        {/* Segmented Date Range & Refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-bold">
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: '3months', label: '3 Months' },
              { key: '1year', label: '1 Year' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  timeRange === t.key
                    ? 'bg-slate-900 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing || loading}
            title="Refresh Live Metrics"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ERROR STATE                                                               */}
      {/* ========================================================================= */}
      {error && (
        <div className="bg-red-50/90 border border-red-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div>
              <p className="text-xs font-bold">Failed to load marketplace analytics</p>
              <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP 8 REAL DATABASE KPI CARDS (4 Desktop, 2 Tablet, 1 Mobile)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-36" />
            </div>
          ))
        ) : (
          [
            { 
              label: 'Gross Merchandise Value', 
              val: `₹${Number(kpis.totalGMV || 0).toLocaleString('en-IN')}`, 
              icon: TrendingUp, 
              iconBg: 'bg-amber-500/10 text-amber-600',
              link: '/admin/revenue' 
            },
            { 
              label: 'Total Orders', 
              val: (kpis.totalOrders || 0).toLocaleString('en-IN'), 
              icon: ShoppingBag, 
              iconBg: 'bg-blue-500/10 text-blue-600',
              link: '/admin/shipments' 
            },
            { 
              label: 'Platform Commission', 
              val: `₹${Number(kpis.marketplaceCommission || 0).toLocaleString('en-IN')}`, 
              icon: Landmark, 
              iconBg: 'bg-purple-500/10 text-purple-600',
              link: '/admin/revenue' 
            },
            { 
              label: 'Total Customers', 
              val: (kpis.totalCustomers || 0).toLocaleString('en-IN'), 
              icon: Users2, 
              iconBg: 'bg-emerald-500/10 text-emerald-600',
              link: '/admin/users' 
            },
            { 
              label: 'Active Brands', 
              val: (kpis.totalBrands || 0).toLocaleString('en-IN'), 
              icon: Building2, 
              iconBg: 'bg-indigo-500/10 text-indigo-600',
              link: '/admin/brands' 
            },
            { 
              label: 'Catalog Products', 
              val: (kpis.totalProducts || 0).toLocaleString('en-IN'), 
              icon: PackageOpen, 
              iconBg: 'bg-slate-500/10 text-slate-700',
              link: '/admin/products' 
            },
            { 
              label: 'Pending Settlements', 
              val: (kpis.pendingSettlements || 0).toLocaleString('en-IN'), 
              icon: DollarSign, 
              iconBg: 'bg-orange-500/10 text-orange-600',
              link: '/admin/settlements' 
            },
            { 
              label: 'Pending Returns', 
              val: (kpis.pendingReturns || 0).toLocaleString('en-IN'), 
              icon: RotateCcw, 
              iconBg: 'bg-rose-500/10 text-rose-600',
              link: '/admin/returns' 
            },
          ].map((c, idx) => {
            const Icon = c.icon;
            return (
              <Link
                key={idx}
                to={c.link}
                className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    {c.label}
                  </span>
                  <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {c.val}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. LOW INVENTORY REPLENISHMENT ALERTS                                     */}
      {/* ========================================================================= */}
      {lowStockList.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-2.5 text-amber-900">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-amber-950">
                  Low Inventory Replenishment Alerts ({lowStockList.length})
                </h3>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Items below safety threshold requiring automated supplier purchase orders.
                </p>
              </div>
            </div>
            <Link 
              to="/admin/inventory" 
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-950 hover:text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              <span>View Full Inventory Station</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockList.slice(0, 6).map((inv) => (
              <div 
                key={inv._id} 
                className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-xs flex justify-between items-center hover:border-amber-400 transition-all text-xs"
              >
                <div className="overflow-hidden pr-3">
                  <p className="font-bold text-slate-900 truncate">{inv.productId?.name || inv.sku}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
                    {inv.brandId?.name} • SKU: <span className="font-bold text-slate-700">{inv.sku}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block font-black text-amber-700 text-sm font-mono px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-200">
                    {inv.availableQuantity} Left
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-1">
                    Min: {inv.lowStockThreshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RECENT ORDERS (REAL DATABASE DATA)                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Recent Marketplace Orders
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live orders placed across brand vendors with multi-warehouse fulfillment status.
            </p>
          </div>
          <Link 
            to="/admin/shipments" 
            className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-slate-950 hover:underline"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No recent orders found</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              New customer orders will appear here automatically in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/70 text-left text-xs">
              <thead className="bg-slate-50/80 uppercase tracking-wider font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Fulfillment</th>
                  <th className="px-6 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                      {ord.orderId}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{ord.customer?.name || 'Customer'}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{ord.customer?.email}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {ord.items?.length || 1} item(s)
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                      ₹{Number(ord.finalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        ord.paymentStatus === 'Paid' || ord.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {ord.paymentMethod || 'COD'} • {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        ord.orderStatus === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.orderStatus === 'shipped'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-[11px] text-slate-400 font-mono">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SALES BY CATEGORY & TOP BRAND PARTNERS GRID                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales by Category Performance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Sales by Category Performance
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Revenue distribution across departments.
              </p>
            </div>
            <Link to="/admin/categories" className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline">
              All Categories →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : salesByCategory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Layers className="w-6 h-6 text-slate-300 mx-auto" />
              <p>No category sales recorded for this timeframe.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {salesByCategory.map((cat, idx) => {
                const percent = Math.min(100, Math.round(((cat.revenue || 0) / totalCategoryRevenue) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{cat._id || 'General Hardware'}</span>
                      <span className="font-mono font-black text-slate-900">
                        ₹{Number(cat.revenue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{cat.unitsSold || 0} units sold</span>
                      <span>{cat.orders || 0} orders ({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Brand Partners GMV */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3.5">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Top Brand Partners by GMV
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Authorized hardware vendors by throughput.
              </p>
            </div>
            <Link to="/admin/brands" className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline">
              Brand Directory →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : salesByBrand.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Building2 className="w-6 h-6 text-slate-300 mx-auto" />
              <p>No brand vendor sales recorded in this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {salesByBrand.map((b, idx) => (
                <div key={idx} className="py-3.5 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {b.brandName?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{b.brandName || 'Brand Partner'}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {b.orders || 0} orders • Commission: ₹{Number(b.commission || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <span className="font-black font-mono text-slate-900 text-sm">
                    ₹{Number(b.gmv || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. TOP SELLING PRODUCTS LEADERBOARD                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200/80 pb-3.5">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Top Selling Hardware Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-velocity enterprise and gaming electronics ranking by units dispatched.
            </p>
          </div>
          <Link to="/admin/products" className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline">
            All Products Matrix →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-xl" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <PackageOpen className="w-6 h-6 text-slate-300 mx-auto" />
            <p>No product sales recorded in this timeframe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/70 text-left text-xs">
              <thead className="bg-slate-50/80 uppercase tracking-wider font-extrabold text-[10px] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-medium">
                    <td className="px-4 py-3 font-bold text-slate-900">{p.productName}</td>
                    <td className="px-4 py-3 text-slate-500">{p.brandName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">{p.unitsSold}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                      ₹{Number(p.revenue || 0).toLocaleString('en-IN')}
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

export default AdminDashboard;
