import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, Search, ChevronLeft, ChevronRight, Eye, 
  Clock, Package, Truck, CheckCheck, FileText, ArrowRight,
  ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import orderService from '../../services/orderService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Container from '../../components/ui/Container';
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

  // Filter params
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrders({
        search,
        status,
        page,
        limit: 8,
      });
      if (res.success) {
        setOrders(res.orders || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setError('Unable to load your orders. Please try again.');
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

  const handleStatusTab = (tabStatus) => {
    const params = new URLSearchParams(searchParams);
    if (tabStatus && tabStatus !== 'all') params.set('status', tabStatus);
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

  const tabs = [
    { label: 'All Orders', value: 'all' },
    { label: 'Active & Dispatched', value: 'active' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <Container className="py-10 space-y-8 text-left max-w-6xl">
      
      {/* 1. Header with Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            My Marketplace Purchases
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Track multi-brand shipments, view verified GST invoices, and manage device warranty registrations.
          </p>
        </div>

        <Link to="/products">
          <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 border-b md:border-b-0 pb-2 md:pb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusTab(tab.value)}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                status === tab.value
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'text-brand-gray-600 hover:text-brand-gray-900 hover:bg-brand-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search by Order ID or product name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Orders List */}
      {loading ? (
        <div className="space-y-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4 animate-pulse">
              <div className="flex justify-between items-center border-b pb-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-4">
          <ShoppingBag className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No orders found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            {search || status !== 'all'
              ? 'No orders match your active search and filter parameters.'
              : "You haven't placed any marketplace orders yet. Explore our curated catalog to purchase official hardware."}
          </p>
          <Link to="/products">
            <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const childOrders = order.childOrders || [];
            const brandsList = childOrders.map((so) => so.seller?.name || 'Brand Partner').filter(Boolean);
            const uniqueBrands = [...new Set(brandsList)];

            return (
              <div
                key={order._id}
                className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden transition-all hover:border-brand-gray-300"
              >
                {/* Master Order Card Header Strip */}
                <div className="bg-brand-gray-50 border-b border-brand-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Master Order</span>
                      <span className="font-mono font-black text-brand-accent">{order.orderId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Order Date</span>
                      <span className="font-bold text-brand-gray-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Total Amount</span>
                      <span className="font-black text-brand-gray-900">₹{order.finalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Payment</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <StatusBadge status={order.orderStatus} />
                    <Link to={`/order-details/${order.orderId}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
                      >
                        <span>View Order Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Multi-Brand Shipment Splitting Previews */}
                <div className="p-6 space-y-5 divide-y divide-brand-gray-100">
                  {childOrders.map((so) => (
                    <div key={so._id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-brand-accent" />
                          <span className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
                            {so.seller?.name || 'Brand Partner'} Shipment
                          </span>
                          <span className="text-[10px] font-mono text-brand-gray-400">({so.orderId})</span>
                        </div>
                        <StatusBadge status={so.fulfillmentStatus} />
                      </div>

                      {/* Items Grid for this Brand */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {so.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-brand-light p-3 rounded-sm border border-brand-gray-200 flex items-center space-x-3"
                          >
                            <div className="w-10 h-10 rounded border bg-white p-1 shrink-0 overflow-hidden">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                                alt=""
                                className="object-cover h-full w-full rounded-sm"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-brand-gray-900 truncate" title={item.name}>
                                {item.name}
                              </p>
                              <p className="text-[10px] text-brand-gray-500 font-semibold">
                                Qty: {item.qty} • ₹{(item.price * item.qty).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="p-4 border border-brand-gray-200 bg-white rounded-sm shadow-premium flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-gray-600 font-semibold">
            <span>
              Showing {((page - 1) * 8) + 1} to {Math.min(page * 8, total)} of {total} orders
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
              
              <span className="px-3 py-1 font-black text-brand-gray-900 bg-brand-light border rounded">
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

    </Container>
  );
};

export default Orders;
