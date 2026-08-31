import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Search, Filter, ChevronLeft, ChevronRight, 
  FileText, Calendar, Plus, ExternalLink, QrCode, AlertCircle, 
  CheckCircle2, Clock, X, RefreshCw, MapPin
} from 'lucide-react';
import shippingService from '../../services/shippingService';
import { brandSellerService } from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const BrandShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [providerStatus, setProviderStatus] = useState({ configured: false, provider: 'Shiprocket' });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Create Shipment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [pkgDimensions, setPkgDimensions] = useState({ length: 20, breadth: 15, height: 10, weight: 1.0 });
  const [courierName, setCourierName] = useState('Blue Dart Express');
  const [customAwb, setCustomAwb] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Tracking Detail Modal
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);

  // Status Update Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState('');
  const [nextStatus, setNextStatus] = useState('in_transit');
  const [statusLoc, setStatusLoc] = useState('');
  const [statusDesc, setStatusDesc] = useState('');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shippingService.getBrandShipments({
        search,
        status,
        page,
        limit: 10,
      });
      if (res.success) {
        setShipments(res.shipments || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setSummary(res.summary || {});
        if (res.providerStatus) setProviderStatus(res.providerStatus);
      }
    } catch (err) {
      console.error('Error loading brand shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [search, status, page]);

  // Load orders eligible for shipment creation
  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    setActionMsg({ type: '', text: '' });
    try {
      const res = await brandSellerService.getOrders({ status: 'all', limit: 50 });
      if (res.success) {
        // Eligible: payment is confirmed and not yet delivered/cancelled
        const orders = (res.orders || []).filter(
          (o) => o.paymentStatus === 'Paid' && o.fulfillmentStatus !== 'Delivered' && o.fulfillmentStatus !== 'Cancelled'
        );
        setEligibleOrders(orders);
        if (orders.length > 0) setSelectedOrderId(orders[0]._id);
      }
    } catch (err) {
      console.error('Error fetching eligible orders:', err);
    }
  };

  const handleCreateShipmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setActionMsg({ type: 'error', text: 'Please select an eligible order.' });
      return;
    }

    setCreateLoading(true);
    setActionMsg({ type: '', text: '' });
    try {
      const res = await shippingService.createBrandShipment({
        sellerOrderId: selectedOrderId,
        package: pkgDimensions,
        courierName,
        awbNumber: customAwb,
      });

      if (res.success) {
        setActionMsg({ type: 'success', text: `Shipment ${res.shipment.shipmentId} created successfully!` });
        fetchShipments();
        setTimeout(() => setShowCreateModal(false), 1500);
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Error creating shipment.' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGenerateLabel = async (shipmentId) => {
    try {
      const res = await shippingService.generateBrandLabel(shipmentId);
      if (res.success) {
        alert('Shipping label generated!');
        if (res.labelUrl) window.open(res.labelUrl, '_blank');
        fetchShipments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating label.');
    }
  };

  const handleSchedulePickup = async (shipmentId) => {
    try {
      const res = await shippingService.scheduleBrandPickup(shipmentId, new Date());
      if (res.success) {
        alert('Courier pickup successfully scheduled.');
        fetchShipments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error scheduling pickup.');
    }
  };

  const handleOpenStatusModal = (shipment) => {
    setStatusTargetId(shipment._id);
    setNextStatus(shipment.shipmentStatus === 'created' ? 'pickup_scheduled' : 'in_transit');
    setStatusLoc(shipment.pickupAddress?.city || 'Bengaluru');
    setStatusDesc('');
    setShowStatusModal(true);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await shippingService.updateBrandShipmentStatus(statusTargetId, {
        status: nextStatus,
        location: statusLoc,
        description: statusDesc,
      });
      if (res.success) {
        setShowStatusModal(false);
        fetchShipments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status.');
    }
  };

  const handleInspectTracking = async (shipment) => {
    setSelectedShipment(shipment);
    setTrackingEvents([]);
    try {
      const res = await shippingService.getBrandShipmentById(shipment._id);
      if (res.success) {
        setTrackingEvents(res.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Logistics & Outbound Shipments
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Manage carrier allocations, print GST shipping manifests, and track package milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shipment</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Shipments', val: total, color: 'text-brand-gray-900' },
          { label: 'Created / Label', val: (summary.created || 0) + (summary.label_generated || 0), color: 'text-amber-600' },
          { label: 'In Transit', val: (summary.in_transit || 0) + (summary.picked_up || 0), color: 'text-blue-600' },
          { label: 'Out for Delivery', val: summary.out_for_delivery || 0, color: 'text-purple-600' },
          { label: 'Delivered', val: summary.delivered || 0, color: 'text-emerald-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Search & Status Filter */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Shipment ID, AWB, customer, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Status:</span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
          >
            <option value="all">All Shipments</option>
            <option value="created">Created</option>
            <option value="label_generated">Label Generated</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed_delivery">Delivery Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 4. Shipments Master Table */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm p-6 space-y-4 shadow-premium">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Truck className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No shipments found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            Create a shipment for your paid orders to assign courier labels and track dispatches.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="text-xs uppercase font-bold">
            Create First Shipment
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Shipment ID</th>
                  <th className="px-4 py-3.5">Seller Order</th>
                  <th className="px-4 py-3.5">Recipient & Destination</th>
                  <th className="px-4 py-3.5">Courier & AWB</th>
                  <th className="px-4 py-3.5">Package</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {shipments.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-accent">
                      {s.shipmentId}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {s.sellerOrderId?.orderId || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{s.shippingAddress?.fullName}</p>
                      <p className="text-[10px] text-brand-gray-500">{s.shippingAddress?.city}, {s.shippingAddress?.state}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{s.courier?.name || 'KAIA Express'}</p>
                      <span className="font-mono text-[10px] text-brand-gray-500">
                        {s.awbNumber || s.trackingNumber || 'Pending AWB'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-brand-gray-600">
                      {s.package?.weight} kg ({s.package?.length}x{s.package?.breadth}x{s.package?.height} cm)
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.shipmentStatus} />
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {s.shipmentStatus === 'created' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateLabel(s._id)}
                          className="text-[10px] font-bold uppercase px-2 py-1"
                        >
                          Print Label
                        </Button>
                      )}

                      {(s.shipmentStatus === 'created' || s.shipmentStatus === 'label_generated') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSchedulePickup(s._id)}
                          className="text-[10px] font-bold uppercase px-2 py-1 text-amber-700 border-amber-300"
                        >
                          Pickup
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStatusModal(s)}
                        className="text-[10px] font-bold uppercase px-2 py-1"
                      >
                        Update
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInspectTracking(s)}
                        className="text-[10px] font-bold uppercase px-2 py-1"
                      >
                        Track
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} shipments</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE SHIPMENT MODAL                                            */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Create Courier Shipment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionMsg.text && (
              <div className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
                actionMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                {actionMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{actionMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateShipmentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Select Paid Seller Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-bold"
                  required
                >
                  {eligibleOrders.length === 0 ? (
                    <option value="">No eligible orders pending shipment</option>
                  ) : (
                    eligibleOrders.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.orderId} — {o.customerName} ({o.itemsCount} items) • ₹{o.amount}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Package Dimensions */}
              <div className="space-y-2 pt-2 border-t border-brand-gray-100">
                <h4 className="font-bold text-brand-gray-700 uppercase">Package Weight & Dimensions</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-brand-gray-500 font-bold block">Length (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={pkgDimensions.length}
                      onChange={(e) => setPkgDimensions({ ...pkgDimensions, length: Number(e.target.value) })}
                      className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-gray-500 font-bold block">Breadth (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={pkgDimensions.breadth}
                      onChange={(e) => setPkgDimensions({ ...pkgDimensions, breadth: Number(e.target.value) })}
                      className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-gray-500 font-bold block">Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={pkgDimensions.height}
                      onChange={(e) => setPkgDimensions({ ...pkgDimensions, height: Number(e.target.value) })}
                      className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-gray-500 font-bold block">Weight (kg)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={pkgDimensions.weight}
                      onChange={(e) => setPkgDimensions({ ...pkgDimensions, weight: Number(e.target.value) })}
                      className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Carrier Choice */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Assigned Courier</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">AWB Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto or Manual AWB"
                    value={customAwb}
                    onChange={(e) => setCustomAwb(e.target.value)}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={createLoading || eligibleOrders.length === 0}>
                  {createLoading ? 'Creating...' : 'Confirm & Create Shipment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STATUS UPDATE MODAL                                              */}
      {/* ========================================================================= */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Update Shipment Milestone</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Next Milestone *</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold uppercase"
                >
                  <option value="pickup_scheduled">Pickup Scheduled</option>
                  <option value="picked_up">Picked Up by Courier</option>
                  <option value="in_transit">In Transit / Carrier Hub</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered to Customer</option>
                  <option value="failed_delivery">Delivery Attempt Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Current Transit Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru Central Hub"
                  value={statusLoc}
                  onChange={(e) => setStatusLoc(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-brand-gray-700 uppercase">Activity Log Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Package arrived at local sorting facility"
                  value={statusDesc}
                  onChange={(e) => setStatusDesc(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Apply Milestone Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TRACKING EVENTS INSPECTOR                                        */}
      {/* ========================================================================= */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-brand-gray-900 uppercase">
                  Shipment: {selectedShipment.shipmentId}
                </h3>
                <p className="text-[10px] text-brand-gray-500 font-mono">
                  AWB: {selectedShipment.awbNumber || selectedShipment.trackingNumber || 'N/A'} • {selectedShipment.courier?.name}
                </p>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-brand-gray-700 uppercase">Transit Timeline ({trackingEvents.length})</h4>
              {trackingEvents.length === 0 ? (
                <p className="text-xs text-brand-gray-400 italic">No carrier activity logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {trackingEvents.map((evt, idx) => (
                    <div key={idx} className="bg-brand-light p-2.5 rounded border border-brand-gray-200 text-xs flex items-start space-x-2">
                      <span className="w-2 h-2 rounded-full bg-brand-accent mt-1 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-brand-gray-900">{evt.description}</span>
                          <span className="text-[10px] text-brand-gray-400 font-mono">
                            {new Date(evt.eventTime).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {evt.location && <span className="text-[10px] text-brand-gray-500">{evt.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedShipment(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BrandShipments;
