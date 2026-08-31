import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, Filter, ChevronLeft, ChevronRight, Eye, 
  Building2, Package, AlertTriangle, ShieldCheck, RefreshCw, 
  CheckCircle2, X
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUnits: 0, availableUnits: 0, reservedUnits: 0, soldUnits: 0, lowStockCount: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Adjust Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Admin Physical Audit');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchAdminInventory = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminInventory({
        search,
        brandId,
        status,
        page,
        limit: 20,
      });

      if (res.success) {
        setInventory(res.inventory || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching admin inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInventory();
  }, [search, brandId, status, page]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustLoading(true);

    try {
      const res = await brandSellerService.adjustStock({
        productId: adjustTarget.productId?._id || adjustTarget.productId,
        warehouseId: adjustTarget.warehouseId?._id || adjustTarget.warehouseId,
        newQuantity: Number(adjustQty),
        reason: adjustReason,
      });

      if (res.success) {
        alert('Stock successfully adjusted by admin.');
        setShowAdjustModal(false);
        fetchAdminInventory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adjusting stock.');
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Inventory & Multi-Depot Stocks
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Centralized inventory counts across all brand warehouse depots with real-time reservation and low-stock auditing.
          </p>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Catalog Units', val: stats.totalUnits, color: 'text-brand-gray-900' },
          { label: 'Available Stock', val: stats.availableUnits, color: 'text-emerald-600' },
          { label: 'Reserved (In Orders)', val: stats.reservedUnits, color: 'text-amber-600' },
          { label: 'Sold & Dispatched', val: stats.soldUnits, color: 'text-blue-600' },
          { label: 'Low Stock Alerts', val: stats.lowStockCount, color: 'text-red-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Search & Filters */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by SKU, product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
          >
            <option value="all">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* 4. Inventory Table */}
      {loading ? (
        <div className="bg-white p-6 space-y-4 rounded border">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Package className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No marketplace inventory found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Product & SKU</th>
                  <th className="px-4 py-3.5">Brand Partner</th>
                  <th className="px-4 py-3.5">Warehouse Depot</th>
                  <th className="px-4 py-3.5 text-center">Available</th>
                  <th className="px-4 py-3.5 text-center">Reserved</th>
                  <th className="px-4 py-3.5 text-center">Sold</th>
                  <th className="px-4 py-3.5 text-center">Total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Audit</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {inventory.map((inv) => (
                  <tr key={inv._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{inv.productId?.name || 'Hardware Unit'}</p>
                      <span className="text-[10px] font-mono text-brand-gray-400">SKU: {inv.sku}</span>
                    </td>

                    <td className="px-4 py-3.5 font-bold uppercase text-brand-gray-900">
                      {inv.brandId?.name || 'Brand Partner'}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-brand-gray-900">{inv.warehouseId?.name || 'Primary Depot'}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">{inv.warehouseId?.city || 'India Depot'}</span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-black text-emerald-700 text-sm">
                      {inv.availableQuantity}
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-amber-600">
                      {inv.reservedQuantity}
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-blue-600">
                      {inv.soldQuantity}
                    </td>

                    <td className="px-4 py-3.5 text-center font-black text-brand-gray-900">
                      {inv.totalQuantity}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustTarget(inv);
                          setAdjustQty(inv.totalQuantity);
                          setShowAdjustModal(true);
                        }}
                        className="text-[10px] font-bold uppercase px-2 py-1"
                      >
                        Reconcile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} records</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-xs uppercase px-2 py-1">
                <ChevronLeft className="w-4 h-4 mr-0.5" /> Prev
              </Button>
              <span className="px-3 py-1 font-black text-brand-gray-900 bg-white border rounded">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="text-xs uppercase px-2 py-1">
                Next <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Admin Stock Reconciliation</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">New Physical Total *</label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Audit Reason *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                  required
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={adjustLoading}>
                  {adjustLoading ? 'Saving...' : 'Confirm Audit Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminInventory;
