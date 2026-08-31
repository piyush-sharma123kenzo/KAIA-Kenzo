import React, { useState, useEffect } from 'react';
import { 
  Package, QrCode, CheckCircle2, AlertCircle, Search, 
  Clock, ShieldCheck, ArrowRight, Truck, Check, X, 
  FileText, ShieldAlert, Barcode, ClipboardCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const BrandFulfillment = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ready_to_pack'); // 'all', 'ready_to_pack', 'packed'

  // Packing Station Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [scannedSerial, setScannedSerial] = useState('');
  const [serialAssignments, setSerialAssignments] = useState({}); // { [productId]: ['SN1', 'SN2'] }
  const [checklist, setChecklist] = useState({
    productVerified: true,
    serialVerified: true,
    accessoriesIncluded: true,
    invoiceIncluded: true,
    packagingSealed: false,
  });
  const [assigning, setAssigning] = useState(false);
  const [packingLoading, setPackingLoading] = useState(false);
  const [stationMsg, setStationMsg] = useState({ type: '', text: '' });

  const fetchFulfillmentQueue = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getFulfillmentQueue(filterTab);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Error fetching fulfillment queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFulfillmentQueue();
  }, [filterTab]);

  const handleOpenPackingStation = (order) => {
    setSelectedOrder(order);
    setStationMsg({ type: '', text: '' });
    setScannedSerial('');

    // Pre-populate existing assigned serials
    const initial = {};
    (order.items || []).forEach((it) => {
      initial[it.product] = it.serialNumbers ? [...it.serialNumbers] : [];
    });
    setSerialAssignments(initial);

    // Default select first item
    if (order.items && order.items.length > 0) {
      setActiveItem(order.items[0]);
    }
  };

  const handleScanOrAssignSerial = async (e) => {
    e.preventDefault();
    if (!scannedSerial.trim() || !activeItem || !selectedOrder) return;

    setAssigning(true);
    setStationMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.assignOrderSerial(selectedOrder._id, {
        productId: activeItem.product,
        serialNumber: scannedSerial.trim(),
      });

      if (res.success) {
        setStationMsg({ type: 'success', text: `Serial barcode "${scannedSerial.trim()}" successfully assigned!` });
        const updated = { ...serialAssignments };
        updated[activeItem.product] = updated[activeItem.product] || [];
        if (!updated[activeItem.product].includes(scannedSerial.trim())) {
          updated[activeItem.product].push(scannedSerial.trim());
        }
        setSerialAssignments(updated);
        setScannedSerial('');
      }
    } catch (err) {
      setStationMsg({ type: 'error', text: err.response?.data?.message || 'Error validating serial number.' });
    } finally {
      setAssigning(false);
    }
  };

  const handleCompletePacking = async () => {
    if (!selectedOrder) return;
    setPackingLoading(true);
    setStationMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.packOrder(selectedOrder._id, checklist);
      if (res.success) {
        alert(`Order #${selectedOrder.orderId} marked PACKED! Ready for shipment creation.`);
        setSelectedOrder(null);
        fetchFulfillmentQueue();
      }
    } catch (err) {
      setStationMsg({ type: 'error', text: err.response?.data?.message || 'Error packing order.' });
    } finally {
      setPackingLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Order Fulfillment & Packaging Station
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Process confirmed seller orders, scan/assign serial barcodes, and seal packages for courier pickup.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/brand/shipments">
            <Button variant="primary" size="sm" className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1">
              <Truck className="w-4 h-4" />
              <span>Outbound Shipments</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex space-x-2 border-b border-brand-gray-200">
        {[
          { key: 'ready_to_pack', label: 'Ready to Pack (Serials Needed)' },
          { key: 'packed', label: 'Packed & Ready for Dispatch' },
          { key: 'all', label: 'All Active Fulfillment' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              filterTab === tab.key
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Orders Fulfillment Cards / Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <ClipboardCheck className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No orders require fulfillment</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            All current orders for your brand have been packed and handed over to logistics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((ord) => {
            const isPacked = ord.fulfillmentStatus === 'Packed';
            const totalItems = (ord.items || []).reduce((acc, it) => acc + it.qty, 0);

            return (
              <div
                key={ord._id}
                className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-black text-sm text-brand-accent">
                      {ord.orderId}
                    </span>
                    <StatusBadge status={ord.fulfillmentStatus} />
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      Master Ref: {ord.parentOrder?.orderId || 'N/A'}
                    </Badge>
                  </div>

                  <div className="text-xs text-brand-gray-600 space-y-0.5">
                    <p>
                      <strong>Destination:</strong> {ord.shippingAddress?.name}, {ord.shippingAddress?.city} ({ord.shippingAddress?.postalCode})
                    </p>
                    <p className="text-brand-gray-500">
                      Contains {ord.items?.length} product line(s) • Total {totalItems} hardware unit(s) • ₹{ord.finalAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Items badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(ord.items || []).map((it, idx) => (
                      <span key={idx} className="bg-brand-light text-[10px] font-bold px-2 py-0.5 rounded border text-brand-gray-700">
                        {it.name} (x{it.qty}) {it.serialNumbers?.length > 0 ? `[${it.serialNumbers.length} SNs]` : ''}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!isPacked ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenPackingStation(ord)}
                      className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1.5"
                    >
                      <Barcode className="w-4 h-4" />
                      <span>Pack & Scan Serials</span>
                    </Button>
                  ) : (
                    <Link to="/brand/shipments">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs uppercase font-bold tracking-wider text-emerald-700 border-emerald-300 flex items-center space-x-1"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Create Shipment</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PACKING STATION & SCANNER MODAL                                           */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-6 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-brand-gray-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-brand-gray-900 uppercase">
                    Packing Station: {selectedOrder.orderId}
                  </h3>
                  <StatusBadge status={selectedOrder.fulfillmentStatus} />
                </div>
                <p className="text-xs text-brand-gray-500 mt-0.5">
                  Scan and assign physical serial barcodes to verify hardware authenticity.
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Message */}
            {stationMsg.text && (
              <div className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
                stationMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}>
                {stationMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{stationMsg.text}</span>
              </div>
            )}

            {/* Order Items Selector */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-brand-gray-700 uppercase">Select Product Line to Scan:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(selectedOrder.items || []).map((it) => {
                  const isSelected = activeItem?.product === it.product;
                  const assignedCount = (serialAssignments[it.product] || []).length;
                  const isComplete = assignedCount >= it.qty;

                  return (
                    <button
                      key={it.product}
                      type="button"
                      onClick={() => { setActiveItem(it); setStationMsg({ type: '', text: '' }); }}
                      className={`p-3 rounded-sm border text-left transition-all ${
                        isSelected
                          ? 'border-brand-accent bg-brand-light ring-2 ring-brand-accent/20'
                          : 'border-brand-gray-200 hover:bg-brand-light'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs text-brand-gray-900 truncate">{it.name}</p>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-amber-600 shrink-0">
                            {assignedCount}/{it.qty}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-brand-gray-500 mt-1">
                        SKU: {it.sku || 'N/A'} • Required: {it.qty} unit{it.qty > 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Serial Scanning Barcode Input Form */}
            {activeItem && (
              <form onSubmit={handleScanOrAssignSerial} className="bg-brand-light p-4 rounded-sm border border-brand-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-gray-800 uppercase flex items-center space-x-1.5">
                    <Barcode className="w-4 h-4 text-brand-accent" />
                    <span>Barcode / QR Serial Scanner</span>
                  </span>
                  <span className="text-[10px] font-mono text-brand-gray-500">
                    Scanning for: <strong>{activeItem.name}</strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan barcode or type serial number (e.g. SN-ASUS-2026-X)..."
                    value={scannedSerial}
                    onChange={(e) => setScannedSerial(e.target.value)}
                    className="flex-1 bg-white border border-brand-gray-250 px-3 py-2 text-xs font-mono font-bold focus:border-brand-accent focus:ring-0 uppercase"
                    autoFocus
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={assigning || !scannedSerial.trim()} className="text-xs uppercase font-bold">
                    {assigning ? 'Verifying...' : 'Assign'}
                  </Button>
                </div>

                {/* Assigned Serials Pills */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold text-brand-gray-500 uppercase block">Assigned Serials for this Item:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(serialAssignments[activeItem.product] || []).length === 0 ? (
                      <span className="text-[11px] text-brand-gray-400 italic">No serials assigned yet.</span>
                    ) : (
                      (serialAssignments[activeItem.product] || []).map((sn, sIdx) => (
                        <span key={sIdx} className="bg-white border border-emerald-300 text-emerald-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{sn}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Mandatory Packing Checklist */}
            <div className="space-y-2 pt-2 border-t border-brand-gray-200 text-xs">
              <h4 className="font-black text-brand-gray-900 uppercase">Packaging & Quality Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'productVerified', label: '1. Hardware SKU & Quantity Verified' },
                  { key: 'serialVerified', label: '2. Serial Numbers & IMEIs Scanned' },
                  { key: 'accessoriesIncluded', label: '3. Cables, Power Bricks & Manuals Enclosed' },
                  { key: 'invoiceIncluded', label: '4. GST Retail Invoice Inside Package' },
                  { key: 'packagingSealed', label: '5. Tamper-evident Security Seal Applied' },
                ].map((chk) => (
                  <label key={chk.key} className="flex items-center space-x-2 p-2 bg-brand-light rounded cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checklist[chk.key]}
                      onChange={(e) => setChecklist({ ...checklist, [chk.key]: e.target.checked })}
                      className="rounded text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="font-semibold text-brand-gray-800">{chk.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t flex justify-between items-center">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={packingLoading || !checklist.packagingSealed}
                onClick={handleCompletePacking}
                className="text-xs uppercase font-bold tracking-wider"
              >
                {packingLoading ? 'Sealing Package...' : 'Seal Package & Mark Packed'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BrandFulfillment;
