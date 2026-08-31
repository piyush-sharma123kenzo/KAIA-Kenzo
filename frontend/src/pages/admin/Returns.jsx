import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Package, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Truck, RefreshCw, XCircle, 
  Building2, QrCode, FileText, Check, X, ShieldAlert, 
  Search, Filter, ChevronLeft, ChevronRight 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, requested: 0, approved: 0, inspection_pending: 0, refunded: 0, replacement_shipped: 0, rejected: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchAdminReturns = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminReturns({ search, brandId, status, page, limit: 20 });
      if (res.success) {
        setReturns(res.returns || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching admin returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReturns();
  }, [search, brandId, status, page]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Returns, Replacements & RMA Ledger
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Centralized RMA claims oversight across all brand sellers with inspection auditing and refund resolution tracking.
          </p>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total RMA Requests', val: stats.total, color: 'text-brand-gray-900' },
          { label: 'Pending Review', val: stats.requested, color: 'text-amber-600' },
          { label: 'Reverse Logistics', val: stats.approved, color: 'text-blue-600' },
          { label: 'Testing Workbench', val: stats.inspection_pending, color: 'text-indigo-600' },
          { label: 'Refunded / Replaced', val: (stats.refunded || 0) + (stats.replacement_shipped || 0), color: 'text-emerald-600' },
          { label: 'Rejected Claims', val: stats.rejected, color: 'text-red-600' },
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
            placeholder="Search by return number, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="inspection_pending">Testing Desk</option>
            <option value="refunded">Refunded</option>
            <option value="replacement_shipped">Replacement Dispatched</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* 4. Returns Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <RotateCcw className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No marketplace returns found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Return Ref</th>
                  <th className="px-4 py-3.5">Brand Seller</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Product & Serials</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-brand-accent">{ret.returnNumber}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">
                        {new Date(ret.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold uppercase text-brand-gray-900">
                      {ret.brandId?.name || 'Brand Partner'}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-brand-gray-900">{ret.customerId?.name}</p>
                      <span className="text-[10px] text-brand-gray-400">{ret.customerId?.email}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {ret.items?.map((it, idx) => (
                        <div key={idx}>
                          <p className="font-bold text-brand-gray-900">{it.productName} (x{it.quantity})</p>
                          {it.serialNumbers && it.serialNumbers.length > 0 && (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">
                              SN: {it.serialNumbers.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-brand-gray-700 uppercase">
                      {ret.reason?.replace(/_/g, ' ')}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant={ret.returnType === 'refund' ? 'primary' : 'success'} className="text-[10px] uppercase font-bold">
                        {ret.returnType}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={ret.status} />
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

    </div>
  );
};

export default AdminReturns;
