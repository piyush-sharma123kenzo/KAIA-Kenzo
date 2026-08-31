import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, Search, ChevronLeft, ChevronRight, Eye, 
  Clock, Package, Truck, CheckCheck, FileText, ArrowUpDown, Filter
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getOrders({
        search,
        status,
        page,
        limit: 10,
      });
      if (res.success) {
        setOrders(res.orders || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching brand orders:', err);
      setError('Unable to load incoming seller orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) params.set('search', searchInput.trim());
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleStatusFilter = (newStatus) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus && newStatus !== 'all') params.set('status', newStatus);
    else params.delete('status');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Fulfillment Order Pipelines</h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Process incoming hardware dispatches, manage unit packing, and track logistics fulfillment.
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Order ID or destination city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Fulfillment Status:</span>
          <select
            value={status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
          >
            <option value="all">All Orders ({total})</option>
            <option value="Processing">Processing</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped / Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm p-6 space-y-4 shadow-premium">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <ShoppingBag className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No orders found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            {search || status !== 'all' ? 'No orders match your current filter parameters.' : 'Your store has received no customer orders yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Assigned Products</th>
                  <th className="px-5 py-3.5">Customer City</th>
                  <th className="px-5 py-3.5 text-center">Qty</th>
                  <th className="px-5 py-3.5 text-right">Brand Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Order Status</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-3.5 font-mono font-bold text-brand-accent">
                      {order.orderId}
                    </td>

                    {/* Product item details */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <p className="font-bold text-brand-gray-900 truncate" title={order.items[0]?.name}>
                        {order.items[0]?.name || 'Hardware Component'}
                      </p>
                      {order.items.length > 1 && (
                        <span className="text-[10px] text-brand-gray-400 font-semibold block">
                          +{order.items.length - 1} more item(s)
                        </span>
                      )}
                    </td>

                    {/* Customer City */}
                    <td className="px-5 py-3.5 font-medium text-brand-gray-600">
                      {order.customerCity}
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-3.5 text-center font-bold text-brand-gray-800">
                      {order.itemsCount}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right font-black text-brand-gray-900">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-[11px] text-brand-gray-500 font-medium whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <Link to={`/brand/orders/${order._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 text-brand-accent hover:bg-brand-accent/5"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Fulfill / View</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-gray-600 font-semibold">
            <span>
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} orders
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="text-xs uppercase font-bold px-2.5 py-1"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                <span>Prev</span>
              </Button>
              
              <span className="px-3 py-1 font-black text-brand-gray-900 bg-white border rounded">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="text-xs uppercase font-bold px-2.5 py-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
