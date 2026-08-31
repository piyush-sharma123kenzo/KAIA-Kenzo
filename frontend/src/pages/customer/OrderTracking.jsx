import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Truck, Package, CheckCircle2, Clock, MapPin, 
  ShieldCheck, AlertCircle, Copy, Check, ExternalLink, QrCode, 
  Building2, ChevronRight, Calendar
} from 'lucide-react';
import shippingService from '../../services/shippingService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Container from '../../components/ui/Container';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const OrderTracking = () => {
  const { id } = useParams();
  const [shipments, setShipments] = useState([]);
  const [orderId, setOrderId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shippingService.getCustomerOrderShipments(id);
      if (res.success) {
        setShipments(res.shipments || []);
        if (res.orderId) setOrderId(res.orderId);
      }
    } catch (err) {
      console.error('Error loading order tracking:', err);
      setError(err.response?.data?.message || 'Unable to retrieve tracking details for this order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTracking();
  }, [id]);

  const handleCopyAwb = (awb, idx) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Canonical milestones
  const steps = [
    { key: 'created', label: 'Order Confirmed' },
    { key: 'packed', label: 'Packed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'created' || s === 'pending') return 0;
    if (s === 'label_generated' || s === 'pickup_scheduled' || s === 'packed') return 1;
    if (s === 'picked_up' || s === 'shipped') return 2;
    if (s === 'in_transit') return 3;
    if (s === 'out_for_delivery') return 4;
    if (s === 'delivered') return 5;
    return 0;
  };

  if (loading) {
    return (
      <Container className="py-12 max-w-4xl space-y-8 animate-pulse text-left">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (error || shipments.length === 0) {
    return (
      <Container className="py-16 max-w-md mx-auto text-center space-y-4">
        <Truck className="w-12 h-12 text-brand-gray-400 mx-auto" />
        <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
          Tracking Not Available Yet
        </h2>
        <p className="text-xs text-brand-gray-500">
          {error || 'Shipments for this order are currently being prepared by the respective brand warehouses.'}
        </p>
        <Link to={`/order-details/${orderId}`}>
          <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider">
            View Order Details
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10 space-y-8 text-left max-w-4xl pb-24 font-sans">
      
      {/* 1. Navigation Header */}
      <div className="flex items-center space-x-3 border-b border-brand-gray-200 pb-5">
        <Link
          to={`/order-details/${orderId}`}
          className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
                Live Shipment Tracking
              </h1>
              <span className="bg-brand-dark text-white text-[10px] font-black px-2 py-0.5 rounded font-mono">
                {orderId}
              </span>
            </div>
            <p className="text-xs text-brand-gray-500 mt-0.5">
              Tracking {shipments.length} brand package{shipments.length > 1 ? 's' : ''} dispatched from authorized manufacturer depots.
            </p>
          </div>

          <Link to={`/order-details/${orderId}`}>
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold">
              View Order Summary
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Brand-wise Shipments Progression */}
      <div className="space-y-8">
        {shipments.map((shipment, sIdx) => {
          const brand = shipment.brandId || {};
          const currentIdx = getStepIndex(shipment.shipmentStatus);
          const isCancelled = shipment.shipmentStatus === 'cancelled';
          const isFailed = shipment.shipmentStatus === 'failed_delivery';
          const events = shipment.events || [];

          return (
            <div
              key={shipment._id || sIdx}
              className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden space-y-6 p-6"
            >
              {/* Shipment Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded border bg-brand-light p-1.5 flex items-center justify-center font-black text-brand-accent text-sm shrink-0">
                    {brand.logo ? (
                      <img src={brand.logo} alt="" className="object-contain max-h-full max-w-full" />
                    ) : (
                      brand.name?.charAt(0) || 'B'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-brand-gray-900 uppercase tracking-tight">
                        {brand.name || 'Brand Partner'} Package
                      </h3>
                      <Badge variant="success" className="text-[9px] font-bold uppercase">
                        Verified Carrier
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] text-brand-gray-500 font-mono mt-0.5">
                      <span>Shipment ID: <strong className="text-brand-accent">{shipment.shipmentId}</strong></span>
                      {shipment.sellerOrderId?.orderId && (
                        <span>• Ref: {shipment.sellerOrderId.orderId}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={shipment.shipmentStatus} />
                </div>
              </div>

              {/* Logistics & Carrier Overview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-light p-4 rounded-sm border border-brand-gray-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Courier Partner</span>
                  <p className="font-bold text-brand-gray-900 mt-0.5">
                    {shipment.courier?.name || 'KAIA Express Logistics'}
                  </p>
                  <span className="text-[10px] text-brand-gray-500">{shipment.courier?.serviceType || 'Standard Surface / Air Express'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">AWB / Tracking Number</span>
                  {shipment.awbNumber || shipment.trackingNumber ? (
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono font-black text-brand-accent text-sm">
                        {shipment.awbNumber || shipment.trackingNumber}
                      </span>
                      <button
                        onClick={() => handleCopyAwb(shipment.awbNumber || shipment.trackingNumber, sIdx)}
                        className="text-brand-gray-400 hover:text-brand-gray-700"
                        title="Copy AWB number"
                      >
                        {copiedIndex === sIdx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-brand-gray-400 mt-0.5 block">Pending Courier Allotment</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Estimated Delivery</span>
                  <p className="font-black text-brand-gray-900 mt-0.5 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                    <span>
                      {shipment.estimatedDeliveryDate
                        ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
                        : 'Within 3-5 business days'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Visual Multi-Milestone Progression Bar */}
              <div className="py-2 space-y-4">
                <h4 className="text-xs font-black text-brand-gray-500 uppercase tracking-wider">
                  Shipment Progression
                </h4>

                <div className="relative">
                  {/* Connecting Track Line */}
                  <div className="hidden sm:block absolute top-3.5 left-6 right-6 h-0.5 bg-brand-gray-200 -z-0" />
                  <div
                    className="hidden sm:block absolute top-3.5 left-6 h-0.5 bg-brand-accent transition-all duration-500 -z-0"
                    style={{ width: `${Math.min(100, Math.max(0, (currentIdx / (steps.length - 1)) * 100))}%` }}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center relative z-10">
                    {steps.map((step, idx) => {
                      const isDone = currentIdx >= idx && !isCancelled && !isFailed;
                      const isCurrent = currentIdx === idx && !isCancelled && !isFailed;

                      return (
                        <div key={step.key} className="flex flex-col items-center space-y-1.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isDone
                                ? 'bg-brand-accent text-white shadow-sm ring-4 ring-brand-accent/20'
                                : isCurrent
                                ? 'bg-white border-2 border-brand-accent text-brand-accent ring-4 ring-brand-accent/20'
                                : 'bg-white border border-brand-gray-300 text-brand-gray-400'
                            }`}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-bold uppercase leading-tight ${
                              isCurrent
                                ? 'text-brand-accent font-black'
                                : isDone
                                ? 'text-brand-gray-800'
                                : 'text-brand-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real Provider Tracking Event Activity History */}
              {events.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-brand-gray-200">
                  <h4 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider">
                    Carrier Transit Activity History ({events.length})
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {events.map((evt, eIdx) => (
                      <div
                        key={evt._id || eIdx}
                        className="bg-brand-light p-3 rounded-sm border border-brand-gray-200 flex items-start space-x-3 text-xs"
                      >
                        <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-brand-gray-900">{evt.description}</span>
                            <span className="text-[10px] text-brand-gray-400 font-mono">
                              {new Date(evt.eventTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {evt.location && (
                            <p className="text-[11px] text-brand-gray-500 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-brand-gray-400" />
                              <span>{evt.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items in this Brand Shipment Package */}
              <div className="space-y-3 pt-4 border-t border-brand-gray-200">
                <h4 className="text-xs font-bold text-brand-gray-500 uppercase tracking-wider">
                  Enclosed Package Hardware:
                </h4>

                <div className="divide-y divide-brand-gray-100">
                  {(shipment.items || []).map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-brand-gray-900">{item.name}</p>
                        <span className="text-[10px] font-mono text-brand-gray-400">SKU: {item.sku || 'N/A'} • Qty: {item.qty}</span>
                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="flex items-center space-x-1 mt-0.5 text-[10px] font-mono text-emerald-700">
                            <QrCode className="w-3 h-3" />
                            <span>Serial Barcode(s): {item.serialNumbers.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-black text-brand-gray-900">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Destination */}
              <div className="pt-3 border-t border-brand-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-brand-gray-600 gap-2">
                <p className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Destination: <strong className="text-brand-gray-900">{shipment.shippingAddress?.fullName || shipment.shippingAddress?.name || 'Customer'}</strong>, {shipment.shippingAddress?.addressLine1 || shipment.shippingAddress?.street}, {shipment.shippingAddress?.city} - {shipment.shippingAddress?.postalCode}
                  </span>
                </p>
                {shipment.shippingLabelUrl && (
                  <a
                    href={shipment.shippingLabelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 shrink-0"
                  >
                    <span>Official Shipping Label</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </Container>
  );
};

export default OrderTracking;
