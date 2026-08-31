import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Package, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Truck, RefreshCw, XCircle, Search 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Container from '../../components/ui/Container';

const CustomerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const res = await orderService.getMyReturns();
        if (res.success) {
          setReturns(res.returns || []);
        }
      } catch (err) {
        console.error('Error fetching returns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      r.returnNumber?.toLowerCase().includes(s) ||
      r.reason?.toLowerCase().includes(s) ||
      r.items?.some((it) => it.productName?.toLowerCase().includes(s))
    );
  });

  return (
    <Container className="py-10 space-y-8 text-left max-w-5xl pb-24 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            My Returns & Replacements
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Track RMA return requests, courier reverse pickups, device hardware inspection, and refunds.
          </p>
        </div>

        <Link to="/orders">
          <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider">
            View All Purchases
          </Button>
        </Link>
      </div>

      {/* 2. Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by return number or product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
      </div>

      {/* 3. Returns List */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <RotateCcw className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No active return requests</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            You have not requested any returns or replacements. Eligible delivered purchases can be returned within 10 days from your order page.
          </p>
          <Link to="/orders">
            <Button variant="primary" size="sm" className="text-xs uppercase font-bold">
              Check Delivered Orders
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <div
              key={ret._id}
              className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-gray-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-black text-sm text-brand-accent">{ret.returnNumber}</span>
                  <StatusBadge status={ret.status} />
                  <Badge variant={ret.returnType === 'refund' ? 'primary' : 'success'} className="text-[10px] uppercase font-bold">
                    {ret.returnType}
                  </Badge>
                </div>

                <div className="text-xs text-brand-gray-600 space-y-0.5">
                  <p>
                    <strong>Reason:</strong> {ret.reason.replace(/_/g, ' ').toUpperCase()}
                    {ret.customerComment && ` — "${ret.customerComment}"`}
                  </p>
                  <p className="text-brand-gray-500 font-mono text-[11px]">
                    Requested on {new Date(ret.createdAt).toLocaleDateString('en-IN')} • Order Ref: {ret.sellerOrderId?.orderId || ret.masterOrderId?.orderId}
                  </p>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {ret.items?.map((it, idx) => (
                    <span key={idx} className="bg-brand-light text-[11px] font-bold px-2.5 py-1 rounded border text-brand-gray-800">
                      {it.productName} (x{it.quantity}) {it.serialNumbers?.length > 0 ? `[${it.serialNumbers.join(', ')}]` : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Link to={`/account/returns/${ret._id}`}>
                  <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1">
                    <span>Track Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </Container>
  );
};

export default CustomerReturns;
