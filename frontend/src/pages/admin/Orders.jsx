import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, 
  ChevronUp, Eye, FileText, CheckCircle, AlertTriangle, ShieldCheck, 
  Truck, Package, User, Building2, Calendar, MapPin, X
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [orderStatus, setOrderStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Expanded row state for nested seller orders
  const [expandedRows, setExpandedRows] = useState({});

  // Single Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getOrders({
        search,
        paymentStatus,
        orderStatus,
        page,
        limit: 10,
      });
      if (res.success) {
        setOrders(res.orders || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError('Unable to load marketplace orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, paymentStatus, orderStatus, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const toggleRow = (orderId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const openOrderDetail = async (orderId) => {
    setDetailLoading(true);
    setSelectedOrder(null);
    try {
      const res = await adminService.getOrderById(orderId);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setAuditLogs(res.auditLogs || []);
      }
    } catch (err) {
      alert('Error fetching order detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Master Orders Oversight
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Full marketplace visibility across Master Orders and split Seller Orders across all partner brands.
          </p>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Master/Seller ID, customer, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Payment:</span>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
            >
              <option value="all">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Order Status:</span>
            <select
              value={orderStatus}
              onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }}
              className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
            >
              <option value="all">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="partially_shipped">Partially Shipped</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Orders Master Table with Expandable Seller Orders */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm p-6 space-y-4 shadow-premium">
          {Array(6).fill(0).map((_, i) => (
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
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No marketplace orders found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            No orders match your filter parameters.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5 w-8"></th>
                  <th className="px-4 py-3.5">Master Order ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Brand Splits</th>
                  <th className="px-4 py-3.5 text-right">Amount (INR)</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Master Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Inspect</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {orders.map((order) => {
                  const isExpanded = !!expandedRows[order._id];
                  const childOrders = order.childOrders || [];

                  return (
                    <React.Fragment key={order._id}>
                      {/* Master Order Row */}
                      <tr className="hover:bg-brand-gray-50/70 transition-colors">
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => toggleRow(order._id)}
                            className="p-1 rounded hover:bg-brand-gray-200 text-brand-gray-500"
                            title="Expand Seller Orders"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 font-mono font-bold text-brand-accent">
                          {order.orderId}
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-bold text-brand-gray-900 leading-none">
                            {order.customer?.name || order.shippingAddress?.name || 'Customer'}
                          </p>
                          <p className="text-[10px] text-brand-gray-400 mt-1">{order.customer?.email || order.shippingAddress?.city}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {childOrders.map((so) => (
                              <span
                                key={so._id}
                                className="inline-block bg-brand-light border border-brand-gray-200 text-[10px] font-bold px-2 py-0.5 rounded text-brand-gray-700 uppercase"
                              >
                                {so.seller?.name || 'Brand'}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-brand-gray-900">
                          ₹{order.finalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.orderStatus} />
                        </td>

                        <td className="px-4 py-3.5 text-[11px] text-brand-gray-500 font-medium whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order._id)}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Details</span>
                          </Button>
                        </td>
                      </tr>

                      {/* Nested Expanded Seller Orders Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-brand-light p-4 border-t border-b border-brand-gray-200">
                            <div className="space-y-3 max-w-4xl mx-auto text-left">
                              <h4 className="font-black text-[10px] text-brand-gray-500 uppercase tracking-wider">
                                Sub-Split Seller Orders ({childOrders.length})
                              </h4>

                              <div className="space-y-2">
                                {childOrders.map((so) => (
                                  <div
                                    key={so._id}
                                    className="bg-white p-3 rounded-sm border border-brand-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono font-bold text-brand-accent">{so.orderId}</span>
                                        <span className="font-bold text-brand-gray-900 uppercase">
                                          ({so.seller?.name || 'Brand'})
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-brand-gray-500">
                                        {(so.items || []).map((it) => `${it.name} (x${it.qty})`).join(', ')}
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                      <span className="font-black text-brand-gray-900">₹{so.finalAmount?.toLocaleString('en-IN')}</span>
                                      <StatusBadge status={so.fulfillmentStatus} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-gray-600 font-semibold">
            <span>
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} master orders
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
                className="text-xs uppercase font-bold px-2.5 py-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Single Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-6 text-left">
            <div className="flex justify-between items-start border-b border-brand-gray-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-brand-gray-900 uppercase">
                    Master Order: {selectedOrder.orderId}
                  </h3>
                  <StatusBadge status={selectedOrder.orderStatus} />
                </div>
                <p className="text-xs text-brand-gray-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-brand-light p-4 rounded-sm border border-brand-gray-200">
              <div>
                <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Customer Profile</span>
                <p className="font-black text-brand-gray-900 mt-0.5">{selectedOrder.customer?.name}</p>
                <p className="text-brand-gray-600">{selectedOrder.customer?.email}</p>
                <p className="text-brand-gray-600 font-mono">{selectedOrder.customer?.phone || selectedOrder.shippingAddress?.phone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Delivery Address</span>
                <p className="font-semibold text-brand-gray-900 mt-0.5">{selectedOrder.shippingAddress?.street}</p>
                <p className="text-brand-gray-600">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
              </div>
            </div>

            {/* Brand Seller Orders Tree */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2">
                Brand Seller Orders ({selectedOrder.childOrders?.length || 0})
              </h4>

              <div className="space-y-4">
                {(selectedOrder.childOrders || []).map((so) => (
                  <div key={so._id} className="border border-brand-gray-200 p-4 rounded-sm space-y-3 bg-white">
                    <div className="flex justify-between items-center border-b border-brand-gray-100 pb-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-brand-accent">{so.orderId}</span>
                        <span className="ml-2 font-black text-brand-gray-900 uppercase">({so.seller?.name || 'Brand'})</span>
                      </div>
                      <StatusBadge status={so.fulfillmentStatus} />
                    </div>

                    <div className="space-y-2 text-xs">
                      {(so.items || []).map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-brand-gray-700">
                          <div>
                            <span className="font-semibold text-brand-gray-900">{it.name}</span>
                            <span className="text-[10px] text-brand-gray-400 font-mono ml-2">SKU: {it.sku || it.product?.SKU || 'N/A'}</span>
                          </div>
                          <span className="font-bold">x{it.qty} • ₹{(it.price * it.qty).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-brand-gray-100 flex justify-between items-center text-[11px] text-brand-gray-500 font-semibold">
                      <span>Brand Total: <strong className="text-brand-gray-900">₹{so.finalAmount?.toLocaleString('en-IN')}</strong></span>
                      {so.logistics?.trackingId && (
                        <span className="font-mono text-brand-accent">
                          Tracking: {so.logistics.courierName} - {so.logistics.trackingId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs Trail */}
            {auditLogs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-brand-gray-200">
                <h4 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider">
                  Audit History Trail ({auditLogs.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="p-2 bg-brand-light rounded border text-[10px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-accent">{log.action}</span>
                        <span className="text-brand-gray-600 ml-2">by {log.user?.name || 'System'}</span>
                      </div>
                      <span className="text-brand-gray-400">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-brand-gray-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs uppercase font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
