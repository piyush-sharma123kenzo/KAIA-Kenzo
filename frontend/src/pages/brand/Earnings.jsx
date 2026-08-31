import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, 
  CreditCard, Clock, ShieldCheck, Download, Filter, 
  Search, RefreshCw, FileText, ChevronLeft, ChevronRight, Landmark 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const BrandEarnings = () => {
  const [earnings, setEarnings] = useState({
    availableBalance: 0,
    pendingHoldAmount: 0,
    grossSales: 0,
    totalCommission: 0,
    totalRefunds: 0,
    totalSettled: 0,
    netEarnings: 0,
  });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [earnRes, ledRes] = await Promise.all([
        brandSellerService.getEarnings(),
        brandSellerService.getLedger({ transactionType: typeFilter, page, limit: 20 }),
      ]);

      if (earnRes.success) {
        setEarnings(earnRes);
      }
      if (ledRes.success) {
        setLedgerEntries(ledRes.entries || []);
        setTotalEntries(ledRes.total || 0);
        setTotalPages(ledRes.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [typeFilter, page]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Seller Earnings & Financial Ledger
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Traceable double-entry accounting records, commission breakdowns, and real-time settlement balances.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/brand/settlements">
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1">
              <Landmark className="w-3.5 h-3.5" />
              <span>Settlement Statements</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Financial Balance & Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Available Payout', val: earnings.availableBalance, color: 'text-emerald-700', bg: 'bg-emerald-50/60 border-emerald-200' },
          { label: 'Pending Hold (7-Day)', val: earnings.pendingHoldAmount, color: 'text-amber-600', bg: 'bg-amber-50/60 border-amber-200' },
          { label: 'Gross Sales', val: earnings.grossSales, color: 'text-brand-gray-900', bg: 'bg-white border-brand-gray-200' },
          { label: 'KAIA Commission Fee', val: earnings.totalCommission, color: 'text-indigo-600', bg: 'bg-white border-brand-gray-200' },
          { label: 'Refund Deductions', val: earnings.totalRefunds, color: 'text-red-600', bg: 'bg-white border-brand-gray-200' },
          { label: 'Total Disbursed', val: earnings.totalSettled, color: 'text-blue-700', bg: 'bg-white border-brand-gray-200' },
        ].map((c, idx) => (
          <div key={idx} className={`p-4 rounded-sm border shadow-premium ${c.bg}`}>
            <span className="text-[10px] font-bold text-brand-gray-500 uppercase block">{c.label}</span>
            <p className={`text-xl font-black mt-1 ${c.color}`}>
              ₹{Number(c.val || 0).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Transaction Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex space-x-2 border-b border-brand-gray-200 overflow-x-auto">
          {[
            { key: 'all', label: 'All Transactions' },
            { key: 'SALE', label: 'Gross Sales' },
            { key: 'COMMISSION', label: 'Commissions' },
            { key: 'REFUND', label: 'Refunds' },
            { key: 'SETTLEMENT', label: 'Payouts' },
            { key: 'ADJUSTMENT', label: 'Adjustments' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setTypeFilter(tab.key); setPage(1); }}
              className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                typeFilter === tab.key
                  ? 'border-brand-accent text-brand-accent font-black'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Financial Ledger Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : ledgerEntries.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <CreditCard className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No ledger movements recorded</h3>
          <p className="text-xs text-brand-gray-500">Financial entries will appear as customer orders are delivered and settled.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Posting Date</th>
                  <th className="px-4 py-3.5">Transaction Type</th>
                  <th className="px-4 py-3.5">Order / Ref</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5 text-right">Credit (+)</th>
                  <th className="px-4 py-3.5 text-right">Debit (-)</th>
                  <th className="px-4 py-3.5 text-right">Balance After</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {ledgerEntries.map((e) => (
                  <tr key={e._id} className="hover:bg-brand-gray-50/70 transition-colors font-medium">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-500">
                      {new Date(e.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        e.transactionType === 'SALE' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        e.transactionType === 'COMMISSION' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                        e.transactionType === 'REFUND' ? 'bg-red-50 border-red-200 text-red-800' :
                        e.transactionType === 'SETTLEMENT' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {e.transactionType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-brand-gray-900 font-bold">
                      {e.sellerOrderId?.orderId || e.referenceId || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5 text-brand-gray-700 max-w-xs truncate" title={e.description}>
                      {e.description}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                      {e.entryType === 'credit' ? `+₹${e.amount.toLocaleString('en-IN')}` : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-red-600">
                      {e.entryType === 'debit' ? `-₹${e.amount.toLocaleString('en-IN')}` : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-brand-gray-900">
                      ₹{e.balanceAfter.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalEntries)} of {totalEntries} records</span>
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

export default BrandEarnings;
