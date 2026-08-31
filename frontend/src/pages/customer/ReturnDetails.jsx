import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, RotateCcw, Package, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, Truck, RefreshCw, XCircle, 
  Building2, QrCode, FileText, Check, X, ShieldAlert 
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Container from '../../components/ui/Container';

const ReturnDetails = () => {
  const { id } = useParams();
  const [returnReq, setReturnReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel action
  const [cancelling, setCancelling] = useState(false);

  const fetchReturnDetails = async () => {
    setLoading(true);
    try {
      const res = await orderService.getReturnById(id);
      if (res.success) {
        setReturnReq(res.returnRequest);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching return details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnDetails();
  }, [id]);

  const handleCancelReturn = async () => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelReturn(returnReq._id);
      if (res.success) {
        alert('Return request cancelled.');
        fetchReturnDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling return.');
    } finally {
      setCancelling(false);
    }
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

  if (error || !returnReq) {
    return (
      <Container className="py-16 max-w-md mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-black text-brand-gray-900 uppercase">Return Not Found</h2>
        <p className="text-xs text-brand-gray-500">{error || 'This return request does not exist or you do not have permission to view it.'}</p>
        <Link to="/account/returns">
          <Button variant="primary" size="sm" className="text-xs uppercase font-bold">
            Back to Returns
          </Button>
        </Link>
      </Container>
    );
  }

  const steps = [
    { key: 'requested', label: 'Requested' },
    { key: 'approved', label: 'Approved' },
    { key: 'pickup_scheduled', label: 'Reverse Pickup' },
    { key: 'inspection_pending', label: 'Depot Testing' },
    { key: 'completed', label: returnReq.returnType === 'replacement' ? 'Replaced' : 'Refunded' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'requested': return 0;
      case 'under_review': return 0;
      case 'approved': return 1;
      case 'pickup_scheduled':
      case 'pickup_in_transit': return 2;
      case 'received':
      case 'inspection_pending': return 3;
      case 'inspection_passed':
      case 'refund_processing':
      case 'refunded':
      case 'replacement_processing':
      case 'replacement_shipped':
      case 'replacement_delivered':
      case 'completed': return 4;
      case 'rejected':
      case 'inspection_failed':
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(returnReq.status);

  return (
    <Container className="py-10 space-y-8 text-left max-w-4xl pb-24 font-sans">
      
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center space-x-3 border-b border-brand-gray-200 pb-5">
        <Link to="/account/returns" className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
                Return {returnReq.returnNumber}
              </h1>
              <Badge variant={returnReq.returnType === 'refund' ? 'primary' : 'success'} className="text-xs uppercase font-bold">
                {returnReq.returnType}
              </Badge>
            </div>
            <p className="text-xs text-brand-gray-500 mt-1">
              Order Ref: <span className="font-mono font-bold text-brand-accent">{returnReq.sellerOrderId?.orderId || returnReq.masterOrderId?.orderId}</span> • Requested on {new Date(returnReq.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge status={returnReq.status} />
            {['requested', 'under_review'].includes(returnReq.status) && (
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={handleCancelReturn}
                className="text-xs uppercase font-bold text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Visual Progress Tracker */}
      {currentStep !== -1 && (
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
            RMA Return Status Timeline
          </h3>

          <div className="grid grid-cols-5 gap-2 text-center">
            {steps.map((step, idx) => {
              const isCompleted = currentStep >= idx;
              const isCurrent = currentStep === idx;

              return (
                <div key={step.key} className="flex flex-col items-center space-y-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-brand-accent text-white shadow-sm ring-4 ring-brand-accent/20'
                        : 'bg-white border border-brand-gray-300 text-brand-gray-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
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
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Rejection / Failure Notice if applicable */}
      {returnReq.status === 'rejected' && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs space-y-1">
          <p className="font-bold flex items-center space-x-1.5">
            <XCircle className="w-4 h-4" />
            <span>Return Request Rejected by Brand</span>
          </p>
          <p className="text-red-700">Reason: {returnReq.rejectionReason || 'Does not meet warranty or return criteria.'}</p>
        </div>
      )}

      {/* 4. Returned Items Box */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
        <div className="bg-brand-gray-50 p-4 border-b border-brand-gray-200 flex justify-between items-center text-xs font-bold text-brand-gray-700 uppercase">
          <span>Items in this Return</span>
          <span>Brand: {returnReq.brandId?.name}</span>
        </div>

        <div className="p-6 space-y-4 divide-y divide-brand-gray-100">
          {returnReq.items?.map((it, idx) => (
            <div key={idx} className="pt-4 first:pt-0 flex justify-between items-start text-xs">
              <div className="space-y-1">
                <p className="font-black text-sm text-brand-gray-900">{it.productName}</p>
                <p className="text-brand-gray-500 font-mono text-[11px]">SKU: {it.sku || 'N/A'}</p>
                {it.serialNumbers && it.serialNumbers.length > 0 && (
                  <div className="flex items-center space-x-1 font-mono text-emerald-700 font-bold text-[11px] pt-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Serial: {it.serialNumbers.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="text-right space-y-0.5">
                <p className="font-black text-sm text-brand-gray-900">₹{it.refundAmount?.toLocaleString('en-IN')}</p>
                <p className="text-brand-gray-500 font-bold">Qty: {it.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Pickup & Resolution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Pickup Address */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-3">
          <h3 className="font-black text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2 border-b pb-2">
            <Truck className="w-4 h-4 text-brand-accent" />
            <span>Reverse Pickup Destination</span>
          </h3>
          <div className="space-y-1 text-brand-gray-700">
            <p className="font-bold">{returnReq.pickupDetails?.pickupAddress?.fullName}</p>
            <p>{returnReq.pickupDetails?.pickupAddress?.addressLine1}</p>
            <p>{returnReq.pickupDetails?.pickupAddress?.city}, {returnReq.pickupDetails?.pickupAddress?.state} - {returnReq.pickupDetails?.pickupAddress?.postalCode}</p>
            <p className="text-brand-gray-500 font-mono">Contact: {returnReq.pickupDetails?.pickupAddress?.phone}</p>
          </div>
        </div>

        {/* Resolution Details */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-3">
          <h3 className="font-black text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2 border-b pb-2">
            <ShieldCheck className="w-4 h-4 text-brand-accent" />
            <span>Resolution Information</span>
          </h3>
          <div className="space-y-1 text-brand-gray-700">
            <p><strong>Resolution Mode:</strong> <span className="uppercase font-bold text-brand-accent">{returnReq.returnType}</span></p>
            {returnReq.returnType === 'refund' ? (
              <p><strong>Refund Amount:</strong> <span className="font-black text-brand-gray-900 text-sm">₹{returnReq.resolutionDetails?.refundAmount?.toLocaleString('en-IN')}</span></p>
            ) : (
              <p><strong>Replacement Unit:</strong> <span className="font-bold text-brand-gray-900">Brand Factory Unit</span></p>
            )}
            {returnReq.resolutionDetails?.replacementSerial && (
              <p className="font-mono text-emerald-700 font-bold pt-1">
                New Serial Barcode: {returnReq.resolutionDetails.replacementSerial}
              </p>
            )}
            <p className="text-brand-gray-500 pt-1">Reason: <strong>{returnReq.reason?.replace(/_/g, ' ')}</strong></p>
          </div>
        </div>

      </div>

    </Container>
  );
};

export default ReturnDetails;
