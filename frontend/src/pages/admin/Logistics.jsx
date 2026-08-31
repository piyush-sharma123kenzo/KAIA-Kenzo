import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Filter, ChevronLeft, ChevronRight, Eye, 
  MapPin, Package, Building2, Calendar, FileText, X, CheckCircle, 
  AlertTriangle, ShieldCheck, RefreshCw, QrCode
} from 'lucide-react';
import shippingService from '../../services/shippingService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminLogistics = () => {
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, inTransit: 0, outForDelivery: 0, delivered: 0, failedDelivery: 0, returned: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [brandId, setBrandId] = useState('all');
  const [page, setPage] = useState(1);

  // Inspector Modal
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await shippingService.getAdminShipments({
        search,
        status,
        brandId,
        page,
        limit: 10,
      });
      if (res.success) {
        setShipments(res.shipments || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching admin shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [search, status, brandId, page]);

  const handleInspect = async (id) => {
    setDetailLoading(true);
    setSelectedShipment(null);
    try {
      const res = await shippingService.getAdminShipmentById(id);
      if (res.success) {
        setSelectedShipment(res.shipment);
        setEvents(res.events || []);
      }
    } catch (err) {
      alert('Error fetching shipment detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Central Logistics & Marketplace Dispatches
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Real-time multi-carrier oversight across all brand warehouse shipments, carrier AWB allotments, and delivery SLAs.
          </p>
        </div>
      </div>

      {/* 2. Real Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Shipments', val: stats.total, color: 'text-brand-gray-900' },
          { label: 'In Transit', val: stats.inTransit, color: 'text-blue-600' },
          { label: 'Out for Delivery', val: stats.outForDelivery, color: 'text-purple-600' },
          { label: 'Delivered', val: stats.delivered, color: 'text-emerald-600' },
          { label: 'Failed Delivery', val: stats.failedDelivery, color: 'text-red-600' },
          { label: 'Returned (RTO)', val: stats.returned, color: 'text-amber-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
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
            <option value="all">All Statuses</option>
            <option value="created">Created</option>
            <option value="label_generated">Label Generated</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed_delivery">Failed Delivery</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 4. Shipments Table */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm p-6 space-y-4 shadow-premium">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Truck className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No shipments found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            No marketplace shipments match the active search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Shipment ID</th>
                  <th className="px-4 py-3.5">Master Order</th>
                  <th className="px-4 py-3.5">Brand Partner</th>
                  <th className="px-4 py-3.5">Courier & AWB</th>
                  <th className="px-4 py-3.5">Customer & City</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Inspect</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {shipments.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-accent">
                      {s.shipmentId}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {s.masterOrderId?.orderId || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5 font-bold uppercase text-brand-gray-900">
                      {s.brandId?.name || 'Brand'}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{s.courier?.name || 'KAIA Logistics'}</p>
                      <span className="font-mono text-[10px] text-brand-gray-500">
                        {s.awbNumber || s.trackingNumber || 'Pending AWB'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-brand-gray-900">{s.shippingAddress?.fullName}</p>
                      <span className="text-[10px] text-brand-gray-400">{s.shippingAddress?.city}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.shipmentStatus} />
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspect(s._id)}
                        className="text-[10px] font-bold uppercase px-2.5 py-1"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Details</span>
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

      {/* 5. Deep Inspector Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-6 text-left">
            <div className="flex justify-between items-start border-b border-brand-gray-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-brand-gray-900 uppercase">
                    Shipment: {selectedShipment.shipmentId}
                  </h3>
                  <StatusBadge status={selectedShipment.shipmentStatus} />
                </div>
                <p className="text-xs text-brand-gray-400 font-mono mt-0.5">
                  AWB: {selectedShipment.awbNumber || 'N/A'} • Carrier: {selectedShipment.courier?.name}
                </p>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warehouse Pickup vs Delivery Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-brand-light p-4 rounded-sm border border-brand-gray-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Origin Warehouse</span>
                <p className="font-bold text-brand-gray-900">{selectedShipment.pickupAddress?.name}</p>
                <p className="text-brand-gray-600">{selectedShipment.pickupAddress?.addressLine1}</p>
                <p className="text-brand-gray-600">{selectedShipment.pickupAddress?.city}, {selectedShipment.pickupAddress?.state} - {selectedShipment.pickupAddress?.postalCode}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Delivery Destination</span>
                <p className="font-bold text-brand-gray-900">{selectedShipment.shippingAddress?.fullName}</p>
                <p className="text-brand-gray-600">{selectedShipment.shippingAddress?.addressLine1}</p>
                <p className="text-brand-gray-600">{selectedShipment.shippingAddress?.city}, {selectedShipment.shippingAddress?.state} - {selectedShipment.shippingAddress?.postalCode}</p>
              </div>
            </div>

            {/* Carrier Activity Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2">
                Carrier Transit Events ({events.length})
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-brand-gray-400 italic">No carrier activity recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {events.map((evt, idx) => (
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

export default AdminLogistics;
