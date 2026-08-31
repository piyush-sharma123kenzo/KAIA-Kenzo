import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, MapPin, Truck, CheckCircle2, ShieldCheck, 
  Clock, AlertTriangle, QrCode, FileText, Package, Check, X, ShieldAlert, 
  ExternalLink, Building2, RotateCcw
} from 'lucide-react';
import orderService from '../../services/orderService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Container from '../../components/ui/Container';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const OrderDetails = () => {
  const { id, orderId: paramOrderId } = useParams();
  const targetId = id || paramOrderId;
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState({ type: '', text: '' });

  // Return / Replacement Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSellerOrder, setReturnSellerOrder] = useState(null);
  const [returnItem, setReturnItem] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnSerial, setReturnSerial] = useState('');
  const [returnReason, setReturnReason] = useState('defective');
  const [returnType, setReturnType] = useState('refund');
  const [returnComment, setReturnComment] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnMsg, setReturnMsg] = useState({ type: '', text: '' });

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrderById(targetId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Order not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) fetchOrder();
  }, [targetId]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setCancelMsg({ type: '', text: '' });

    if (!cancelReason.trim()) {
      setCancelMsg({ type: 'error', text: 'Please provide a cancellation reason.' });
      return;
    }

    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(order.orderId, cancelReason);
      if (res.success) {
        setCancelMsg({ type: 'success', text: 'Order cancelled successfully.' });
        fetchOrder();
        setTimeout(() => setShowCancelModal(false), 1500);
      }
    } catch (err) {
      setCancelMsg({ type: 'error', text: err.response?.data?.message || 'Error cancelling order.' });
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = (childOrderId) => {
    const url = orderService.getInvoiceUrl(childOrderId);
    window.open(url, '_blank');
  };

  const handleOpenReturnModal = (so, item) => {
    setReturnSellerOrder(so);
    setReturnItem(item);
    setReturnQty(1);
    setReturnSerial(item.serialNumbers?.[0] || '');
    setReturnReason('defective');
    setReturnType('refund');
    setReturnComment('');
    setReturnMsg({ type: '', text: '' });
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnSellerOrder || !returnItem) return;

    setSubmittingReturn(true);
    setReturnMsg({ type: '', text: '' });

    try {
      const res = await orderService.createReturn({
        masterOrderId: order._id,
        sellerOrderId: returnSellerOrder._id,
        items: [
          {
            productId: returnItem.product,
            productName: returnItem.name,
            quantity: Number(returnQty),
            serialNumbers: returnSerial ? [returnSerial] : [],
          },
        ],
        reason: returnReason,
        customerComment: returnComment,
        returnType,
      });

      if (res.success) {
        setReturnMsg({ type: 'success', text: 'Return request submitted successfully!' });
        setTimeout(() => {
          setShowReturnModal(false);
          navigate(`/account/returns/${res.returnRequest._id}`);
        }, 1200);
      }
    } catch (err) {
      setReturnMsg({ type: 'error', text: err.response?.data?.message || 'Error submitting return request.' });
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-12 max-w-5xl space-y-8 animate-pulse text-left">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-16 max-w-md mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Order Not Found</h2>
        <p className="text-xs text-brand-gray-500">{error || 'This order does not exist or you do not have permission to view it.'}</p>
        <Link to="/orders">
          <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider">
            Back to Orders
          </Button>
        </Link>
      </Container>
    );
  }

  const childOrders = order.childOrders || [];
  const steps = ['Processing', 'Packed', 'Shipped', 'Delivered'];
  const canCancel = order.orderStatus === 'processing' || order.orderStatus === 'pending_payment' || order.orderStatus === 'paid';

  return (
    <Container className="py-10 space-y-8 text-left max-w-5xl pb-24">
      
      {/* 1. Header & Navigation */}
      <div className="flex items-center space-x-3 border-b border-brand-gray-200 pb-5">
        <Link to="/orders" className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
                Order {order.orderId}
              </h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-brand-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs uppercase font-bold text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Master Order Financial & Payment Overview Strip */}
      <div className="bg-brand-dark text-white p-6 rounded-sm border border-brand-gray-850 shadow-premiumDark grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider">Payment Status</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider">Payment Method</span>
          <p className="text-sm font-black uppercase text-brand-gray-200">
            {order.paymentDetails?.provider || 'Razorpay Gateway'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider">Total Items</span>
          <p className="text-sm font-black text-white">
            {childOrders.reduce((sum, so) => sum + (so.items || []).length, 0)} Products ({childOrders.length} Brands)
          </p>
        </div>

        <div className="space-y-1 text-left md:text-right">
          <span className="text-[10px] font-bold text-brand-gray-400 uppercase tracking-wider">Grand Total (INR)</span>
          <p className="text-xl font-black text-brand-accent">₹{order.finalAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* 3. Multi-Brand Split Fulfillment Sections */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-brand-gray-200 pb-2">
          <h2 className="text-sm font-black text-brand-gray-900 uppercase tracking-wider">
            Brand-Specific Dispatches & Shipments ({childOrders.length})
          </h2>
          <span className="text-[11px] text-brand-gray-500 font-semibold">
            Each brand fulfills and ships their hardware independently.
          </span>
        </div>

        {childOrders.map((so) => {
          const brand = so.seller || {};
          const currentStepIdx = steps.indexOf(so.fulfillmentStatus);

          return (
            <div
              key={so._id}
              className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden space-y-5 p-6"
            >
              {/* Brand Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-gray-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded border bg-brand-light p-1.5 flex items-center justify-center font-black text-brand-accent text-xs shrink-0">
                    {brand.logo ? (
                      <img src={brand.logo} alt="" className="object-contain max-h-full max-w-full" />
                    ) : (
                      brand.name?.charAt(0) || 'B'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-brand-gray-900 uppercase tracking-tight">
                        {brand.name || 'Brand Partner'}
                      </h3>
                      <Badge variant="success" className="text-[9px] font-bold uppercase">
                        Authorized Seller
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">
                      Seller Order Ref: <span className="font-bold text-brand-accent">{so.orderId}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status={so.fulfillmentStatus} />
                  <Link
                    to={`/orders/${order.orderId}/tracking`}
                    className="text-xs font-bold text-white bg-brand-accent hover:bg-brand-accentHover flex items-center space-x-1 px-2.5 py-1 rounded uppercase tracking-wider"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Live</span>
                  </Link>
                  <button
                    onClick={() => handleDownloadInvoice(so._id)}
                    className="text-xs font-bold text-brand-gray-700 hover:text-brand-accent flex items-center space-x-1 border px-2.5 py-1 rounded bg-brand-light uppercase tracking-wider"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Fulfillment Progress Lifecycle */}
              <div className="bg-brand-light p-4 rounded-sm border border-brand-gray-200 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-brand-gray-500">
                  <span>Shipment Progress</span>
                  {so.logistics?.trackingId && (
                    <span className="font-mono text-brand-accent">
                      {so.logistics.courierName || 'Courier'}: {so.logistics.trackingId}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {steps.map((step, idx) => {
                    const isCompleted = currentStepIdx >= idx && so.fulfillmentStatus !== 'Cancelled';
                    const isCurrent = currentStepIdx === idx && so.fulfillmentStatus !== 'Cancelled';

                    return (
                      <div key={step} className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isCompleted
                              ? 'bg-brand-accent text-white shadow-sm'
                              : 'bg-white border border-brand-gray-300 text-brand-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            isCurrent
                              ? 'text-brand-accent font-black'
                              : isCompleted
                              ? 'text-brand-gray-800'
                              : 'text-brand-gray-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items List in this Brand Package */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-brand-gray-500 uppercase tracking-wider">Package Contents:</h4>
                <div className="divide-y divide-brand-gray-100">
                  {so.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded border bg-brand-light p-1 overflow-hidden shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                            alt=""
                            className="object-cover h-full w-full rounded-sm"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-brand-gray-900">{item.name}</p>
                          <span className="text-[10px] font-mono text-brand-gray-400">SKU: {item.sku || 'N/A'}</span>
                          
                          {/* Serials if registered */}
                          {item.serialNumbers && item.serialNumbers.length > 0 && (
                            <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-emerald-700">
                              <QrCode className="w-3 h-3" />
                              <span>Serial(s): {item.serialNumbers.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-brand-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                          <span className="text-[10px] text-brand-gray-500 font-bold">Qty: {item.qty}</span>
                        </div>

                        {(so.fulfillmentStatus === 'Delivered' || order.orderStatus === 'delivered') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReturnModal(so, item)}
                            className="text-[10px] uppercase font-bold tracking-wider text-brand-accent border-brand-accent/40 hover:bg-brand-accent/5 flex items-center space-x-1 px-2 py-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3.5. Official GST Tax Invoices & Warranty Documentation */}
      <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
        <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-accent" />
            <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
              Official GST Tax Invoices & Warranty Coverage
            </h3>
          </div>
          <Badge variant="neutral" className="text-[10px] font-mono">
            {childOrders.length} Seller Invoice{childOrders.length > 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {childOrders.map((so) => (
            <div key={so._id} className="bg-brand-light p-4 rounded-sm border border-brand-gray-200 flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="font-bold text-xs text-brand-gray-900">{so.seller?.name || 'Brand Partner'} Tax Invoice</p>
                <p className="text-[10px] font-mono text-brand-gray-500">
                  Ref: {so.invoiceNumber || `INV-${so.orderId}`}
                </p>
                <div className="flex items-center space-x-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700">1-Yr Authorized Brand Warranty</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadInvoice(so._id)}
                className="text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Shipping & Billing Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-3">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2 border-b border-brand-gray-200 pb-2">
            <MapPin className="w-4 h-4 text-brand-accent" />
            <span>Delivery Destination</span>
          </h3>
          <div className="text-xs text-brand-gray-700 space-y-1">
            <p className="font-black text-brand-gray-900">{order.shippingAddress?.name}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
            <p className="font-mono font-bold text-brand-gray-900">PIN: {order.shippingAddress?.postalCode}</p>
            {order.shippingAddress?.phone && (
              <p className="pt-1 text-[11px] text-brand-gray-500 font-mono">Contact: {order.shippingAddress.phone}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-3">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2 border-b border-brand-gray-200 pb-2">
            <Building2 className="w-4 h-4 text-brand-accent" />
            <span>Billing & Tax Details</span>
          </h3>
          <div className="text-xs text-brand-gray-700 space-y-1">
            <p className="font-black text-brand-gray-900">{order.billingAddress?.name || order.shippingAddress?.name}</p>
            <p>{order.billingAddress?.street || order.shippingAddress?.street}</p>
            <p>{order.billingAddress?.city || order.shippingAddress?.city}, {order.billingAddress?.state || order.shippingAddress?.state}</p>
            {order.gstNumber && (
              <p className="pt-1 font-mono font-bold text-brand-accent uppercase">
                GSTIN: {order.gstNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Cancel Marketplace Order</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelMsg.text && (
              <div
                className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
                  cancelMsg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {cancelMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{cancelMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-4 text-xs">
              <p className="text-brand-gray-600">
                Are you sure you want to cancel order <span className="font-bold text-brand-gray-900">{order.orderId}</span>? Reserved items across all brand packages will be released.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Cancellation Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Changed my mind, found better price, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs focus:border-brand-accent focus:ring-0"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                  className="text-xs uppercase font-bold"
                >
                  Keep Order
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={cancelling}
                  className="text-xs uppercase font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return / Replacement Request Modal */}
      {showReturnModal && returnSellerOrder && returnItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-brand-gray-900 uppercase">
                  Request Return / Replacement
                </h3>
                <p className="text-xs text-brand-gray-500 font-mono">
                  {returnSellerOrder.seller?.name || 'Brand Partner'} • {returnItem.name}
                </p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {returnMsg.text && (
              <div className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
                returnMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                {returnMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{returnMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              
              {/* Return Type (Refund vs Replacement) */}
              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Preferred Resolution *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-3 rounded border text-center cursor-pointer font-bold transition-all ${
                    returnType === 'refund' ? 'border-brand-accent bg-brand-light text-brand-accent' : 'border-brand-gray-200 text-brand-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="returnType"
                      value="refund"
                      checked={returnType === 'refund'}
                      onChange={() => setReturnType('refund')}
                      className="sr-only"
                    />
                    <span>Full Gateway Refund</span>
                  </label>

                  <label className={`p-3 rounded border text-center cursor-pointer font-bold transition-all ${
                    returnType === 'replacement' ? 'border-brand-accent bg-brand-light text-brand-accent' : 'border-brand-gray-200 text-brand-gray-600'
                  }`}>
                    <input
                      type="radio"
                      name="returnType"
                      value="replacement"
                      checked={returnType === 'replacement'}
                      onChange={() => setReturnType('replacement')}
                      className="sr-only"
                    />
                    <span>Replacement Unit</span>
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={returnItem.qty}
                    value={returnQty}
                    onChange={(e) => setReturnQty(Number(e.target.value))}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold text-xs"
                    required
                  />
                </div>

                {/* Serial Barcode if applicable */}
                {returnItem.serialNumbers && returnItem.serialNumbers.length > 0 && (
                  <div className="space-y-1">
                    <label className="font-bold text-brand-gray-700 uppercase">Select Serial Barcode *</label>
                    <select
                      value={returnSerial}
                      onChange={(e) => setReturnSerial(e.target.value)}
                      className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-mono text-xs"
                      required
                    >
                      {returnItem.serialNumbers.map((sn) => (
                        <option key={sn} value={sn}>{sn}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Reason for Return *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-semibold text-xs"
                  required
                >
                  <option value="defective">Defective / Malfunctioning Hardware</option>
                  <option value="dead_on_arrival">Dead on Arrival (DOA)</option>
                  <option value="damaged">Damaged in Transit</option>
                  <option value="performance_issue">Performance / Thermal Issue</option>
                  <option value="wrong_product">Wrong Item Delivered</option>
                  <option value="missing_parts">Missing In-Box Accessories</option>
                  <option value="not_as_described">Not as Described on Website</option>
                  <option value="other">Other Reason</option>
                </select>
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Description / Defect Notes</label>
                <textarea
                  rows={3}
                  placeholder="Please describe the issue in detail..."
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-brand-gray-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingReturn}
                  className="text-xs uppercase font-bold tracking-wider"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit RMA Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Container>
  );
};

export default OrderDetails;
