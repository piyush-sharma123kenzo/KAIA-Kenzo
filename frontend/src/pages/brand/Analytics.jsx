import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, IndianRupee, ShoppingBag, Package, Calendar, 
  ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw,
  Layers, MapPin, Cpu, BarChart3, PieChart, ShieldCheck, AlertCircle
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview'); // overview, categories, models, areas

  // Analytics states
  const [dashboardData, setDashboardData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [error, setError] = useState(null);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, catRes, modRes, areaRes] = await Promise.allSettled([
        brandSellerService.getDashboard(),
        brandSellerService.getCategoryAnalytics(timeRange),
        brandSellerService.getModelAnalytics(timeRange),
        brandSellerService.getAreaAnalytics(timeRange)
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setDashboardData(dashRes.value);
      }
      if (catRes.status === 'fulfilled' && catRes.value.success) {
        setCategoryData(catRes.value.categories || []);
      }
      if (modRes.status === 'fulfilled' && modRes.value.success) {
        setModelData(modRes.value.models || []);
      }
      if (areaRes.status === 'fulfilled' && areaRes.value.success) {
        setAreaData(areaRes.value.areas || []);
      }
    } catch (err) {
      console.error('Error fetching brand analytics:', err);
      setError('Failed to aggregate real-time metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeRange]);

  const metrics = dashboardData?.metrics || {};
  const salesChart = dashboardData?.salesChart || [];

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight flex items-center space-x-2">
            <span>Vendor Intelligence & Analytics</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-brand-accent/10 text-brand-accent font-mono uppercase font-bold">
              Production Telemetry
            </span>
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Real-time multi-dimensional analytics: revenue velocity, category distribution, model performance, and regional demand.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="inline-flex rounded-sm shadow-sm bg-brand-light p-1 border border-brand-gray-200 text-xs">
            {[
              { label: 'Today', val: 'today' },
              { label: '7D', val: '7d' },
              { label: '30D', val: '30d' },
              { label: '90D', val: '90d' },
              { label: 'All Time', val: 'all' }
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setTimeRange(t.val)}
                className={`px-3 py-1.5 rounded-[2px] font-bold uppercase tracking-wider text-[11px] transition-colors ${
                  timeRange === t.val
                    ? 'bg-brand-dark text-white shadow-sm'
                    : 'text-brand-gray-600 hover:text-brand-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={fetchAllAnalytics} className="flex items-center space-x-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top-Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Gross Product Sales</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> Direct brand order revenue
          </span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Total Customer Orders</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              {metrics.totalOrders || 0}
            </span>
          </div>
          <span className="text-[10px] text-brand-gray-500 font-bold">100% verified database transactions</span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Active Catalog Size</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-brand-gray-900">
              {metrics.totalProducts || 0}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            {metrics.publishedProducts || 0} live on storefront
          </span>
        </div>

        <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
          <span className="text-xs text-brand-gray-500 font-bold uppercase tracking-wider">Pending Orders</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600">
              {metrics.pendingOrders || 0}
            </span>
          </div>
          <span className="text-[10px] text-brand-gray-500 font-bold">Awaiting packing & dispatch</span>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="border-b border-brand-gray-200 flex space-x-6">
        {[
          { id: 'overview', label: 'Overview & Velocity', icon: BarChart3 },
          { id: 'categories', label: 'Category Telemetry', icon: Layers },
          { id: 'models', label: 'Model & SKU Performance', icon: Cpu },
          { id: 'areas', label: 'Regional Demand Aggregation', icon: MapPin }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
                isActive
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-6">
                <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
                  <h2 className="text-sm font-black text-brand-gray-900 uppercase">Revenue Breakdown Over Time</h2>
                  <span className="text-[11px] text-brand-gray-400 font-mono">Aggregated directly from brand item ledger</span>
                </div>

                {salesChart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-xs text-brand-gray-400 italic space-y-2">
                    <BarChart3 className="w-10 h-10 text-brand-gray-300" />
                    <p>No transactions registered for your brand in this timeframe.</p>
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
                              className="w-full bg-brand-dark group-hover:bg-amber-600 transition-all rounded-t-sm"
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
          )}

          {/* TAB 2: CATEGORY TELEMETRY */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
              <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">Category-Wise Performance</h3>
                  <p className="text-[11px] text-brand-gray-500 mt-0.5">Product distribution, units moved, and gross sales per hardware category.</p>
                </div>
              </div>

              {categoryData.length === 0 ? (
                <div className="p-16 text-center text-xs text-brand-gray-400 italic">
                  No category analytics available for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                    <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                      <tr>
                        <th className="px-6 py-3.5">Category Name</th>
                        <th className="px-6 py-3.5 text-center">Listed Products</th>
                        <th className="px-6 py-3.5 text-center">Approved & Live</th>
                        <th className="px-6 py-3.5 text-center">Units Sold</th>
                        <th className="px-6 py-3.5 text-right">Gross Sales</th>
                        <th className="px-6 py-3.5 text-right">Revenue Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                      {categoryData.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-brand-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-brand-gray-900">
                            {cat.categoryName}
                          </td>
                          <td className="px-6 py-3.5 text-center font-semibold text-brand-gray-700">
                            {cat.totalProducts}
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-emerald-700">
                            {cat.approvedProducts}
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-brand-gray-900">
                            {cat.unitsSold}
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-brand-accent">
                            ₹{cat.revenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-bold text-brand-gray-700">
                            {cat.percentageOfSales}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MODEL & SKU PERFORMANCE */}
          {activeTab === 'models' && (
            <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
              <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight">Model & SKU Breakdown</h3>
                  <p className="text-[11px] text-brand-gray-500 mt-0.5">Stock velocity, revenue generation, and inventory balance by hardware model.</p>
                </div>
              </div>

              {modelData.length === 0 ? (
                <div className="p-16 text-center text-xs text-brand-gray-400 italic">
                  No model-specific sales records found for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                    <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                      <tr>
                        <th className="px-6 py-3.5">SKU / Model</th>
                        <th className="px-6 py-3.5">Product Title</th>
                        <th className="px-6 py-3.5 text-center">Units Sold</th>
                        <th className="px-6 py-3.5 text-center">Orders</th>
                        <th className="px-6 py-3.5 text-center">Current Stock</th>
                        <th className="px-6 py-3.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                      {modelData.map((m, idx) => (
                        <tr key={idx} className="hover:bg-brand-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-brand-accent">
                            {m.sku}
                            {m.modelNumber && <span className="block text-[10px] text-brand-gray-400">{m.modelNumber}</span>}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-brand-gray-900 max-w-xs truncate" title={m.name}>
                            {m.name}
                          </td>
                          <td className="px-6 py-3.5 text-center font-black text-brand-gray-900">
                            {m.unitsSold}
                          </td>
                          <td className="px-6 py-3.5 text-center font-semibold text-brand-gray-700">
                            {m.ordersCount}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`font-bold ${m.stockQuantity <= 4 ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {m.stockQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-brand-accent">
                            ₹{m.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REGIONAL AREA AGGREGATION */}
          {activeTab === 'areas' && (
            <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
              <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-brand-gray-900 uppercase tracking-tight flex items-center space-x-1.5">
                    <span>Regional Market Demand</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                      Privacy-Preserving
                    </span>
                  </h3>
                  <p className="text-[11px] text-brand-gray-500 mt-0.5">
                    Aggregated geographic distribution showing high-demand delivery zones without disclosing customer personal information.
                  </p>
                </div>
              </div>

              {areaData.length === 0 ? (
                <div className="p-16 text-center text-xs text-brand-gray-400 italic">
                  No regional deliveries recorded for your brand items in this timeframe.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                    <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                      <tr>
                        <th className="px-6 py-3.5">City</th>
                        <th className="px-6 py-3.5">State</th>
                        <th className="px-6 py-3.5 text-center">Area Code</th>
                        <th className="px-6 py-3.5 text-center">Order Volume</th>
                        <th className="px-6 py-3.5 text-center">Units Delivered</th>
                        <th className="px-6 py-3.5 text-right">Zone Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                      {areaData.map((area, idx) => (
                        <tr key={idx} className="hover:bg-brand-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-brand-gray-900">
                            {area.city}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-brand-gray-700">
                            {area.state}
                          </td>
                          <td className="px-6 py-3.5 text-center font-mono text-[11px] text-brand-gray-500">
                            {area.pincode}
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-brand-gray-900">
                            {area.ordersCount}
                          </td>
                          <td className="px-6 py-3.5 text-center font-semibold text-brand-gray-700">
                            {area.unitsSold}
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-brand-accent">
                            ₹{area.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Analytics;
