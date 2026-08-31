import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, ChevronLeft, ChevronRight, 
  CheckCircle2, Clock, XCircle, RefreshCw, Landmark, FileText, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalCaptured: 0, totalRefunded: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminPayments({ search, status, page, limit: 20 });
      if (res.success) {
        setPayments(res.payments || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, status, page]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Gateway Payments & Reconciliation Ledger
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Razorpay gateway transaction records, captured merchant funds, and refund reconciliations.
          </p>
        </div>
      </div>

      {/* 2. Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Total Processed Payments</span>
          <p className="text-xl font-black text-brand-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Total Captured Revenue</span>
          <p className="text-xl font-black text-emerald-700 mt-1">₹{stats.totalCaptured?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Total Refunded Outflows</span>
          <p className="text-xl font-black text-red-600 mt-1">₹{stats.totalRefunded?.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* 3. Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-brand-gray-400" />
          <input
            type="text"
            placeholder="Search by Razorpay Payment ID, Order ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent shadow-sm"
          />
        </div>

        <div className="flex space-x-2 border-b border-brand-gray-200 overflow-x-auto">
          {[
            { key: 'all', label: 'All Payments' },
            { key: 'captured', label: 'Captured' },
            { key: 'refunded', label: 'Refunded' },
            { key: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                status === tab.key
                  ? 'border-brand-accent text-brand-accent font-black'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Payments Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <CreditCard className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No payment transactions found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Payment ID</th>
                  <th className="px-4 py-3.5">Customer / Order</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Refund Status</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-brand-gray-50/70 transition-colors font-medium">
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-brand-accent">{p.razorpayPaymentId || p.paymentId || 'N/A'}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">{p.razorpayOrderId}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{p.user?.name || 'Customer'}</p>
                      <Link to={`/admin/orders/${p.order?.orderId}`} className="text-[11px] text-brand-accent font-mono hover:underline">
                        Order #{p.order?.orderId || 'N/A'}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-brand-gray-900 text-sm">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 font-bold uppercase text-[10px] text-brand-gray-600">
                      {p.method || 'Card / UPI'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === 'captured' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        p.status === 'refunded' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-xs">
                      {p.amountRefunded > 0 ? (
                        <span className="text-red-600 font-bold">-₹{p.amountRefunded?.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-brand-gray-400">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
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

export default AdminPayments;
