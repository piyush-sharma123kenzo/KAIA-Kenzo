import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingBag, Users2, Building2, PackageOpen, 
  Landmark, RotateCcw, AlertTriangle, ArrowUpRight, 
  Layers, CreditCard, Clock, ShieldCheck, Download, ChevronRight, Eye,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Filter, Store, DollarSign,
  ArrowDownRight, HelpCircle, MapPin, Activity, Zap, Plus, ExternalLink,
  Truck, Award, BarChart3, ChevronUp, FileText, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getAdminDashboard(timeRange);
      if (res.success) {
        setData(res);
        setLastUpdated(new Date());
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

  // Derive operational metrics
  const totalGMVNum = Number(kpis.totalGMV || 0);
  const totalOrdersNum = Number(kpis.totalOrders || kpis.allOrdersCount || 0);
  const aov = totalOrdersNum > 0 ? Math.round(totalGMVNum / totalOrdersNum) : 0;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-24 font-sans animate-fadeIn">
      
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO BANNER (Cyber/Modern Dark Gradient & Ambient Glow)      */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Production
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-300 border border-white/10">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Central Telemetry
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              Marketplace Command Center
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-medium leading-relaxed">
              Real-time enterprise intelligence across multi-brand vendor orders, inventory reserves, delivery hubs, and financial settlements.
            </p>
          </div>

          {/* Time Selector & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Segmented Time Range Pills */}
            <div className="inline-flex p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 text-xs font-bold shadow-inner overflow-x-auto">
              {[
                { key: 'today', label: 'Today' },
                { key: '7days', label: '7D' },
                { key: 'thisMonth', label: 'This Month' },
                { key: '30days', label: '30D' },
                { key: '3months', label: '3M' },
                { key: '1year', label: '1Y' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTimeRange(t.key)}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap text-xs font-bold ${
                    timeRange === t.key
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              title="Refresh Live Metrics"
              className="px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white transition-all shadow-md flex items-center justify-center gap-2 text-xs font-bold group"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 transition-transform ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Operational Micro Pulse Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Telemetry:</span>
            <strong className="text-emerald-400 font-bold">100% Online</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Avg Order Value:</span>
            <strong className="text-white font-bold">₹{aov.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Delivery Hubs:</span>
            <strong className="text-amber-400 font-bold">{kpis.activeDeliveryAreas || 8} Active</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Last Synchronized:</span>
            <strong className="text-slate-300 font-bold">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ERROR BANNER                                                              */}
      {/* ========================================================================= */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex items-center justify-between text-red-900 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-xl text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-950">Marketplace Telemetry Connection Alert</p>
              <p className="text-[11px] text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REVOLUTIONARY 8-METRIC COMMAND MATRIX                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-10 rounded-2xl" />
              </div>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
          ))
        ) : (
          [
            { 
              label: 'Gross Merchandise Value', 
              val: `₹${Number(kpis.totalGMV || 0).toLocaleString('en-IN')}`, 
              sub: `${kpis.totalOrders || 0} paid customer orders`,
              tag: 'Gross Volume',
              tagColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
              icon: TrendingUp, 
              gradient: 'from-amber-500/10 to-amber-500/0',
              borderTop: 'border-t-4 border-t-amber-500',
              iconBg: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
              link: '/admin/revenue' 
            },
            { 
              label: 'Total Orders', 
              val: (kpis.allOrdersCount || kpis.totalOrders || 0).toLocaleString('en-IN'), 
              sub: `${kpis.pendingOrders || 0} pending • ${kpis.deliveredOrders || 0} delivered`,
              tag: 'Fulfillment',
              tagColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
              icon: ShoppingBag, 
              gradient: 'from-blue-500/10 to-blue-500/0',
              borderTop: 'border-t-4 border-t-blue-500',
              iconBg: 'bg-blue-600 text-white shadow-blue-500/30',
              link: '/admin/orders' 
            },
            { 
              label: 'Platform Commission', 
              val: `₹${Number(kpis.marketplaceCommission || 0).toLocaleString('en-IN')}`, 
              sub: `Seller net payables: ₹${Number(kpis.sellerPayables || 0).toLocaleString('en-IN')}`,
              tag: 'Net Platform Take',
              tagColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
              icon: Landmark, 
              gradient: 'from-purple-500/10 to-purple-500/0',
              borderTop: 'border-t-4 border-t-purple-500',
              iconBg: 'bg-purple-600 text-white shadow-purple-500/30',
              link: '/admin/revenue' 
            },
            { 
              label: 'Customers & Accounts', 
              val: (kpis.totalCustomers || kpis.totalUsers || 0).toLocaleString('en-IN'), 
              sub: `${kpis.totalUsers || 0} total users • ${kpis.totalBrands || 0} verified brands`,
              tag: 'Active Directory',
              tagColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
              icon: Users2, 
              gradient: 'from-emerald-500/10 to-emerald-500/0',
              borderTop: 'border-t-4 border-t-emerald-500',
              iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
              link: '/admin/users' 
            },
            { 
              label: 'Delivery Coverage Hubs', 
              val: (kpis.activeDeliveryAreas || 0).toLocaleString('en-IN'), 
              sub: 'Serviceable 10 KM radial hubs active',
              tag: 'Geofenced',
              tagColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
              icon: MapPin, 
              gradient: 'from-indigo-500/10 to-indigo-500/0',
              borderTop: 'border-t-4 border-t-indigo-500',
              iconBg: 'bg-indigo-600 text-white shadow-indigo-500/30',
              link: '/admin/delivery-locations' 
            },
            { 
              label: 'Catalog Hardware Products', 
              val: (kpis.totalProducts || 0).toLocaleString('en-IN'), 
              sub: `${kpis.activeProducts || 0} published live • ${kpis.lowStockProducts || 0} low stock`,
              tag: 'Live Catalog',
              tagColor: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
              icon: PackageOpen, 
              gradient: 'from-cyan-500/10 to-cyan-500/0',
              borderTop: 'border-t-4 border-t-cyan-500',
              iconBg: 'bg-cyan-600 text-white shadow-cyan-500/30',
              link: '/admin/products' 
            },
            { 
              label: 'Payment Transactions', 
              val: (kpis.paidPayments || kpis.totalPayments || 0).toLocaleString('en-IN'), 
              sub: `${kpis.paidPayments || 0} captured • ${kpis.failedPayments || 0} failed attempts`,
              tag: 'Gateway',
              tagColor: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
              icon: CreditCard, 
              gradient: 'from-teal-500/10 to-teal-500/0',
              borderTop: 'border-t-4 border-t-teal-500',
              iconBg: 'bg-teal-600 text-white shadow-teal-500/30',
              link: '/admin/payments' 
            },
            { 
              label: 'Pending Settlements', 
              val: (kpis.pendingSettlements || 0).toLocaleString('en-IN'), 
              sub: `${kpis.pendingReturns || 0} pending customer returns`,
              tag: 'Payout Queue',
              tagColor: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
              icon: DollarSign, 
              gradient: 'from-rose-500/10 to-rose-500/0',
              borderTop: 'border-t-4 border-t-rose-500',
              iconBg: 'bg-rose-600 text-white shadow-rose-500/30',
              link: '/admin/settlements' 
            },
          ].map((c, idx) => {
            const Icon = c.icon;
            return (
              <Link
                key={idx}
                to={c.link}
                className={`group relative bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden ${c.borderTop}`}
              >
                {/* Subtle Card Glow Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                      {c.label}
                    </span>
                    <div className={`w-10 h-10 rounded-2xl ${c.iconBg} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                      {c.val}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-slate-500 transition-colors" />
                      {c.sub}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-md font-bold border ${c.tagColor}`}>
                    {c.tag}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-900 font-bold inline-flex items-center gap-0.5 transition-colors">
                    Explore <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. LOW INVENTORY REPLENISHMENT RADAR                                      */}
      {/* ========================================================================= */}
      {lowStockList.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-300/80 p-6 sm:p-7 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide text-slate-950 flex items-center gap-2">
                  Low Inventory Replenishment Radar ({lowStockList.length})
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/80 text-amber-900 border border-amber-300 font-bold">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  SKUs breaching safety stock threshold across vendor fulfillment warehouses.
                </p>
              </div>
            </div>
            <Link 
              to="/admin/inventory" 
              className="inline-flex items-center space-x-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 px-4 py-2.5 rounded-2xl transition-all shadow-md hover:shadow-lg shrink-0"
            >
              <span>Manage Warehouse Inventory</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockList.slice(0, 6).map((inv) => (
              <div 
                key={inv._id} 
                className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-amber-200/80 shadow-xs flex justify-between items-center hover:border-amber-400 hover:shadow-md transition-all text-xs"
              >
                <div className="overflow-hidden pr-3 space-y-1">
                  <p className="font-bold text-slate-950 truncate">{inv.productId?.name || inv.sku}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">{inv.brandId?.name || 'Brand'}</span>
                    <span>SKU: {inv.sku}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block font-black text-rose-600 text-sm font-mono px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-200">
                    {inv.availableQuantity} Left
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono mt-1 font-bold">
                    Threshold: {inv.lowStockThreshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RECENT MARKETPLACE ORDERS TERMINAL                                      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Recent Marketplace Orders
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Multi-vendor order routing, payment verification, and dispatch milestones.
            </p>
          </div>
          <Link 
            to="/admin/orders" 
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-900 hover:text-amber-600 bg-white border border-slate-200 hover:border-amber-400 px-4 py-2 rounded-2xl transition-all shadow-xs"
          >
            <span>View All Orders Terminal</span>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200 shadow-inner">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800">No Orders in Selected Period</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                Customer purchases across all brand storefronts will automatically populate here with instant telemetry.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Link to="/admin/products" className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                View Catalog
              </Link>
              <Link to="/admin/delivery-locations" className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                Verify Hubs
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-100/60 uppercase tracking-wider font-black text-[10px] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items / Vendors</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment State</th>
                  <th className="px-6 py-4">Fulfillment</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-slate-950">
                      <Link to={`/admin/orders/${ord._id}`} className="hover:text-amber-600 hover:underline">
                        {ord.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {ord.customer?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{ord.customer?.name || 'Customer'}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{ord.customer?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-700 font-bold text-[11px]">
                        {ord.items?.length || 1} item(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-slate-950 text-sm">
                      ₹{Number(ord.finalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        ord.paymentStatus === 'Paid' || ord.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ord.paymentStatus === 'Paid' || ord.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {ord.paymentMethod || 'Razorpay'} • {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        ord.orderStatus === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ord.orderStatus === 'shipped'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] text-slate-400 font-mono">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SPLIT ANALYTICS: CATEGORY PERFORMANCE & BRAND PARTNER THROUGHPUT       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales by Category Performance */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-7 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Departmental Sales Performance
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Relative revenue distribution by hardware department.
              </p>
            </div>
            <Link to="/admin/categories" className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 hover:underline">
              Categories <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : salesByCategory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">No category transactions in period</p>
              <p className="text-[11px] text-slate-400">Department metrics will recalculate dynamically upon customer orders.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {salesByCategory.map((cat, idx) => {
                const percent = Math.min(100, Math.round(((cat.revenue || 0) / totalCategoryRevenue) * 100));
                return (
                  <div key={idx} className="space-y-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-xs">{cat._id || 'Hardware'}</span>
                      <span className="font-mono font-black text-slate-900">
                        ₹{Number(cat.revenue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {/* High-Tech Progress Track */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{cat.unitsSold || 0} units dispatched</span>
                      <span className="font-bold text-slate-600">{percent}% Share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Brand Partners Throughput */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-7 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Top Brand Partners by Throughput
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Authorized hardware manufacturers ranked by GMV.
              </p>
            </div>
            <Link to="/admin/brands" className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 hover:underline">
              Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : salesByBrand.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">No brand sales in period</p>
              <p className="text-[11px] text-slate-400">Throughput rankings will activate upon multi-vendor orders.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {salesByBrand.map((b, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all flex justify-between items-center bg-slate-50/40">
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
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
      {/* 6. TOP SELLING HARDWARE MATRIX                                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top Selling Hardware Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              High-velocity enterprise and gaming electronics ranking by units dispatched.
            </p>
          </div>
          <Link to="/admin/products" className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 hover:underline">
            All Products Matrix <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-2xl" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <PackageOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">No hardware product velocity data</p>
            <p className="text-[11px] text-slate-400">High-velocity items will be automatically indexed as orders process.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 uppercase tracking-wider font-black text-[10px] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Units Dispatched</th>
                  <th className="px-4 py-3 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors font-medium">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.productName}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold text-[10px]">
                        {p.brandName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-600 text-sm">{p.unitsSold}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900 text-sm">
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
