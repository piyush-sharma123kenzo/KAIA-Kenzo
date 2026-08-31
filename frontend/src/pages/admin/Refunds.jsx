import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, CheckCircle2, AlertTriangle, Clock, 
  IndianRupee, Search, Filter, RefreshCw 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Refunds = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/returns');
      if (res.data.success) {
        // Filter those with refund resolution or approved status
        setReturns(res.data.returns || []);
      }
    } catch (err) {
      console.error('Error fetching admin refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const filteredRefunds = returns.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.returnNumber || '').toLowerCase().includes(term) ||
      (r.customerId?.name || '').toLowerCase().includes(term) ||
      (r.brandId?.name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Refund & Reversal Ledger
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Reconciliation of customer return refunds, payment gateway transactions, and seller commission reversals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by RMA, customer, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent"
            />
            <Search className="w-3.5 h-3.5 text-brand-gray-400 absolute left-2.5 top-2.5" />
          </div>
          <Button variant="outline" size="sm" onClick={fetchRefunds}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Refunds Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filteredRefunds.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-12 text-center rounded-sm shadow-premium space-y-3">
          <RotateCcw className="w-10 h-10 text-brand-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-brand-gray-700 uppercase">No active refund records</h3>
          <p className="text-xs text-brand-gray-400">Processed returns and refunds will appear in this ledger.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-light border-b border-brand-gray-200 text-brand-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">RMA / Return #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Brand Depot</th>
                  <th className="p-3.5">Resolution</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Requested Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100 font-medium">
                {filteredRefunds.map((item) => (
                  <tr key={item._id} className="hover:bg-brand-light/30">
                    <td className="p-3.5 font-mono font-bold text-brand-gray-900">{item.returnNumber}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-brand-gray-900">{item.customerId?.name || 'Customer'}</p>
                      <span className="text-[10px] text-brand-gray-400">{item.customerId?.email}</span>
                    </td>
                    <td className="p-3.5 font-bold text-brand-gray-700">{item.brandId?.name || 'Brand'}</td>
                    <td className="p-3.5 uppercase font-mono text-[11px] font-bold text-brand-accent">
                      {item.returnType || 'refund'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        item.status === 'refunded' ? 'bg-emerald-50 text-emerald-700' :
                        item.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-brand-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Refunds;
