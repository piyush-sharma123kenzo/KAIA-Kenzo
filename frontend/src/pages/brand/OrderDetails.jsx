import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, MapPin, Truck, CheckCircle2, ShieldCheck, 
  Clock, AlertTriangle, QrCode, FileText, Package, Check, ShieldAlert
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status transition states
  const [targetStatus, setTargetStatus] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [courierName, setCourierName] = useState('Blue Dart Express');
  const [serialAssignments, setSerialAssignments] = useState({}); // { [productId]: ['SN1', 'SN2'] }
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getOrderById(id);
      if (res.success) {
        setOrder(res.order);
        setAvailableSerials(res.availableSerials || []);
        setTargetStatus(res.order.fulfillmentStatus);
        setTrackingId(res.order.logistics?.trackingId || '');
        setCourierName(res.order.logistics?.courierName || 'Blue Dart Express');

        // Initialize serial assignments
        const initialSerials = {};
        (res.order.items || []).forEach((item) => {
          initialSerials[item.productId] = item.serialNumbers && item.serialNumbers.length > 0
            ? [...item.serialNumbers]
            : Array(item.qty).fill('');
        });
        setSerialAssignments(initialSerials);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Order not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleSerialChange = (productId, index, value) => {
    const updated = { ...serialAssignments };
    updated[productId] = updated[productId] || [];
    updated[productId][index] = value;
    setSerialAssignments(updated);
  };

  const handleUpdateFulfillment = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    // Format serial assignments array
    const assignmentsPayload = [];
    Object.entries(serialAssignments).forEach(([productId, sList]) => {
      sList.forEach((serialNumber) => {
        if (serialNumber && serialNumber.trim()) {
          assignmentsPayload.push({
            productId,
            serialNumber: serialNumber.trim(),
          });
        }
      });
    });

    setUpdatingStatus(true);
    try {
      const res = await brandSellerService.updateOrderStatus(id, {
        fulfillmentStatus: targetStatus,
        trackingId: trackingId.trim(),
        courierName: courierName.trim(),
        serialAssignments: assignmentsPayload,
      });

      if (res.success) {
        setActionSuccess(`Fulfillment status updated to '${targetStatus}' successfully.`);
        fetchOrderDetails();
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setActionError(err.response?.data?.message || 'Error updating order fulfillment status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse text-left py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto bg-white border border-brand-gray-200 p-12 rounded-sm text-center shadow-premium space-y-4 my-12">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-base font-black text-brand-gray-900 uppercase">Order Access Restricted</h3>
        <p className="text-xs text-brand-gray-500">{error || 'This order does not belong to your authorized brand.'}</p>
        <Link to="/brand/orders">
          <Button variant="primary" size="sm" className="text-xs uppercase font-bold">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const steps = ['Processing', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = steps.indexOf(order.fulfillmentStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-20">
      
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center space-x-3 border-b border-brand-gray-200 pb-4">
        <Link to="/brand/orders" className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
                Order {order.orderId}
              </h2>
              <StatusBadge status={order.fulfillmentStatus} />
            </div>
            <p className="text-xs text-brand-gray-500 mt-0.5">
              Received on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'full' })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Brand Items Total</span>
            <span className="text-lg font-black text-brand-gray-900">₹{order.finalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Visual Status Progress Track */}
      <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium">
        <h3 className="font-bold text-xs text-brand-gray-400 uppercase tracking-wider mb-6">Fulfillment Lifecycle</h3>
        <div className="grid grid-cols-4 gap-2 relative">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx && order.fulfillmentStatus !== 'Cancelled';
            const isCurrent = currentStepIdx === idx && order.fulfillmentStatus !== 'Cancelled';

            return (
              <div key={step} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-brand-accent text-white shadow'
                      : 'bg-brand-light text-brand-gray-400 border border-brand-gray-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isCurrent
                      ? 'text-brand-accent font-black'
                      : isCompleted
                      ? 'text-brand-gray-900'
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

      {/* 3. Items & Shipping Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Shipment Items Checklist (8 cols) */}
        <div className="md:col-span-8 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-3">
            Assigned Brand Items ({order.items.length})
          </h3>

          <div className="space-y-4 divide-y divide-brand-gray-100">
            {order.items.map((item, idx) => {
              const productAvailableSerials = availableSerials.filter(
                (s) => s.product?.toString() === item.productId?.toString()
              );

              return (
                <div key={idx} className={`space-y-3 ${idx > 0 ? 'pt-4' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded border bg-brand-light p-1 overflow-hidden shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}
                          alt=""
                          className="object-cover h-full w-full rounded-sm"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-brand-gray-900">{item.name}</p>
                        <p className="text-[10px] font-mono text-brand-gray-400 mt-0.5">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-brand-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-brand-gray-500 font-bold">Qty: {item.qty}</span>
                    </div>
                  </div>

                  {/* Serial Number Assignment Dropdowns */}
                  <div className="p-3 bg-brand-light rounded border border-brand-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-brand-gray-700 uppercase flex items-center space-x-1">
                        <QrCode className="w-3.5 h-3.5 text-brand-accent" />
                        <span>Serial Barcode Tracking ({item.qty} Unit{item.qty > 1 ? 's' : ''}):</span>
                      </span>
                    </div>

                    {Array(item.qty).fill(0).map((_, unitIdx) => {
                      const currentVal = serialAssignments[item.productId]?.[unitIdx] || '';
                      return (
                        <div key={unitIdx} className="flex items-center space-x-2 text-xs">
                          <span className="text-[10px] font-mono text-brand-gray-400 w-12 shrink-0">Unit {unitIdx + 1}:</span>
                          <select
                            disabled={order.fulfillmentStatus === 'Delivered'}
                            value={currentVal}
                            onChange={(e) => handleSerialChange(item.productId, unitIdx, e.target.value)}
                            className="flex-1 bg-white border border-brand-gray-250 p-1.5 rounded-sm text-xs font-mono font-semibold text-brand-gray-800 focus:border-brand-accent focus:ring-0 disabled:bg-brand-gray-100"
                          >
                            <option value="">-- Assign Physical Serial Number --</option>
                            {currentVal && !productAvailableSerials.some((s) => s.serialNumber === currentVal) && (
                              <option value={currentVal}>{currentVal} (Currently Assigned)</option>
                            )}
                            {productAvailableSerials.map((ser) => (
                              <option key={ser.serialNumber} value={ser.serialNumber}>
                                {ser.serialNumber} {ser.imei1 ? `(IMEI: ${ser.imei1})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing breakdown */}
          <div className="pt-4 border-t border-brand-gray-200 text-xs space-y-1.5 text-brand-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-brand-gray-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax (18% Included):</span>
              <span className="font-bold text-brand-gray-900">₹{order.gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-black text-sm text-brand-gray-900">
              <span>Settlement Sub-Total:</span>
              <span>₹{order.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Shipping & Update Controls (4 cols) */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Shipping Address Card */}
          <div className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-3">
            <h4 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-brand-gray-200 pb-2">
              <MapPin className="w-3.5 h-3.5 text-brand-accent" />
              <span>Customer Shipping</span>
            </h4>
            <div className="text-xs text-brand-gray-700 space-y-1">
              <p className="font-bold text-brand-gray-900">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
              <p className="font-mono font-bold text-brand-gray-900">PIN: {order.shippingAddress?.postalCode}</p>
              {order.shippingAddress?.phone && (
                <p className="pt-1 text-[11px] text-brand-gray-500 font-mono">Contact: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Logistics & Fulfillment Action Panel */}
          <form onSubmit={handleUpdateFulfillment} className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-4">
            <h4 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-brand-gray-200 pb-2">
              <Truck className="w-3.5 h-3.5 text-brand-accent" />
              <span>Dispatch Action</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-gray-700 uppercase">Update Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-bold uppercase tracking-wider focus:border-brand-accent focus:ring-0"
              >
                <option value="Processing">Processing</option>
                <option value="Packed">Packed & Ready</option>
                <option value="Shipped">Shipped / Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-gray-700 uppercase">Courier Service</label>
              <input
                type="text"
                placeholder="e.g. Blue Dart / Delhivery"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-brand-gray-700 uppercase">Logistics Tracking ID</label>
              <input
                type="text"
                placeholder="e.g. TRK987654321"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-mono font-bold focus:border-brand-accent focus:ring-0 uppercase"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updatingStatus}
              className="w-full text-xs uppercase font-bold tracking-wider pt-2"
            >
              {updatingStatus ? 'Updating Dispatch...' : 'Save Fulfillment Step'}
            </Button>
          </form>

        </div>

      </div>

    </div>
  );
};

export default OrderDetails;
