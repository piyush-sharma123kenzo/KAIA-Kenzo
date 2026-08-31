import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, AlertTriangle, CheckCircle2, Search, 
  ArrowUpDown, Filter, Edit3, ShieldAlert, BarChart3, Hash, X, 
  Check, Building2, QrCode, FileSpreadsheet, ArrowRightLeft, 
  Layers, Package, AlertCircle
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const BrandInventory = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'serials', 'warehouses', 'transfers'

  // Data states
  const [inventory, setInventory] = useState([]);
  const [totalInv, setTotalInv] = useState(0);
  const [invStats, setInvStats] = useState({ total: 0, available: 0, reserved: 0, sold: 0, lowStock: 0 });
  const [warehouses, setWarehouses] = useState([]);
  const [serials, setSerials] = useState([]);
  const [serialsSummary, setSerialsSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWh, setSelectedWh] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [showBulkSerialModal, setShowBulkSerialModal] = useState(false);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [targetWhId, setTargetWhId] = useState('');
  const [stockQty, setStockQty] = useState(10);
  const [stockReason, setStockReason] = useState('New Shipment Receipt');
  const [newTotalQty, setNewTotalQty] = useState(0);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });
  const [modalLoading, setModalLoading] = useState(false);

  // Warehouse Form
  const [whForm, setWhForm] = useState({ name: '', code: '', addressLine1: '', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', isPrimary: false });

  // Serial Form
  const [serialForm, setSerialForm] = useState({ serialNumber: '', imei1: '', imei2: '' });
  const [bulkCsvText, setBulkCsvText] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [invRes, whRes, serRes] = await Promise.all([
        brandSellerService.getInventory({ search, warehouseId: selectedWh, status: statusFilter, page, limit: 20 }),
        brandSellerService.getWarehouses(),
        brandSellerService.getSerials({ search, page: 1, limit: 20 }),
      ]);

      if (invRes.success) {
        setInventory(invRes.inventory || []);
        setTotalInv(invRes.total || 0);
        if (invRes.stats) setInvStats(invRes.stats);
      }
      if (whRes.success) setWarehouses(whRes.warehouses || []);
      if (serRes.success) {
        setSerials(serRes.serials || []);
        setSerialsSummary(serRes.summary || {});
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [search, selectedWh, statusFilter, page, activeTab]);

  // Stock In Submit
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setModalLoading(true);
    setModalMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.stockIn({
        productId: selectedProduct,
        warehouseId: targetWhId || undefined,
        quantity: Number(stockQty),
        reason: stockReason,
      });

      if (res.success) {
        setModalMsg({ type: 'success', text: res.message });
        fetchAllData();
        setTimeout(() => setShowStockInModal(false), 1200);
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Error adding stock.' });
    } finally {
      setModalLoading(false);
    }
  };

  // Adjust Stock Submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.adjustStock({
        productId: selectedProduct,
        warehouseId: targetWhId,
        newQuantity: Number(newTotalQty),
        reason: stockReason,
      });

      if (res.success) {
        setModalMsg({ type: 'success', text: res.message });
        fetchAllData();
        setTimeout(() => setShowAdjustModal(false), 1200);
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Error adjusting stock.' });
    } finally {
      setModalLoading(false);
    }
  };

  // Create Warehouse Submit
  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.createWarehouse(whForm);
      if (res.success) {
        setModalMsg({ type: 'success', text: 'Warehouse depot registered!' });
        fetchAllData();
        setTimeout(() => setShowWarehouseModal(false), 1200);
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Error creating warehouse.' });
    } finally {
      setModalLoading(false);
    }
  };

  // Register Single Serial Submit
  const handleSerialSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg({ type: '', text: '' });

    try {
      const res = await brandSellerService.createSerial({
        productId: selectedProduct,
        warehouseId: targetWhId || undefined,
        serialNumber: serialForm.serialNumber,
        imei1: serialForm.imei1,
        imei2: serialForm.imei2,
      });

      if (res.success) {
        setModalMsg({ type: 'success', text: `Serial ${serialForm.serialNumber} registered!` });
        fetchAllData();
        setTimeout(() => setShowSerialModal(false), 1200);
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Error adding serial.' });
    } finally {
      setModalLoading(false);
    }
  };

  // Bulk CSV Ingestion
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg({ type: '', text: '' });

    try {
      const lines = bulkCsvText.trim().split('\n');
      const rows = [];
      lines.forEach((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          rows.push({
            sku: parts[0],
            serialNumber: parts[1],
            imei1: parts[2] || '',
            imei2: parts[3] || '',
          });
        }
      });

      if (rows.length === 0) {
        setModalMsg({ type: 'error', text: 'Invalid CSV format. Expected: SKU, SerialNumber, IMEI1, IMEI2' });
        setModalLoading(false);
        return;
      }

      const res = await brandSellerService.importSerials(rows);
      if (res.success) {
        setModalMsg({
          type: 'success',
          text: `Bulk Ingestion Complete: ${res.successful} successful, ${res.failed} failed.`,
        });
        fetchAllData();
        setTimeout(() => setShowBulkSerialModal(false), 2000);
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Error during bulk import.' });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Warehouse Inventory & Serial Registry
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Real database stock levels across depots, barcode serial allocation, and fulfillment tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowWarehouseModal(true); setModalMsg({ type: '', text: '' }); }}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>+ Warehouse</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowBulkSerialModal(true); setModalMsg({ type: '', text: '' }); }}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Serials</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => { setShowStockInModal(true); setModalMsg({ type: '', text: '' }); }}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Stock In</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Units', val: invStats.total, color: 'text-brand-gray-900' },
          { label: 'Available Units', val: invStats.available, color: 'text-emerald-600' },
          { label: 'Reserved Units', val: invStats.reserved, color: 'text-amber-600' },
          { label: 'Sold Units', val: invStats.sold, color: 'text-blue-600' },
          { label: 'Low Stock Alerts', val: invStats.lowStock, color: 'text-red-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex space-x-2 border-b border-brand-gray-200">
        {[
          { key: 'inventory', label: 'Warehouse Stock Table', icon: Layers },
          { key: 'serials', label: 'Serial & IMEI Registry', icon: QrCode },
          { key: 'warehouses', label: 'Depot Locations', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-1.5 transition-all ${
                activeTab === tab.key
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content 1: Warehouse Stock Table */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by product name, SKU, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedWh}
                onChange={(e) => setSelectedWh(e.target.value)}
                className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Master Inventory Table */}
          {loading ? (
            <div className="bg-white p-6 space-y-4 rounded border">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
              <Package className="w-12 h-12 text-brand-gray-300 mx-auto" />
              <h3 className="text-base font-black text-brand-gray-900 uppercase">No inventory records found</h3>
              <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
                Stock in units from your physical warehouse to make products available for customer purchase.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowStockInModal(true)} className="text-xs uppercase font-bold">
                Stock In First Batch
              </Button>
            </div>
          ) : (
            <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                  <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                    <tr>
                      <th className="px-4 py-3.5">Product & SKU</th>
                      <th className="px-4 py-3.5">Warehouse Depot</th>
                      <th className="px-4 py-3.5 text-center">Available</th>
                      <th className="px-4 py-3.5 text-center">Reserved</th>
                      <th className="px-4 py-3.5 text-center">Sold</th>
                      <th className="px-4 py-3.5 text-center">Total</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                    {inventory.map((inv) => {
                      const prod = inv.productId || {};
                      return (
                        <tr key={inv._id} className="hover:bg-brand-gray-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-brand-gray-900">{prod.name || 'Unnamed Product'}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-brand-gray-400 font-mono mt-0.5">
                              <span>SKU: {inv.sku}</span>
                              {prod.isSerialTracked && (
                                <span className="text-indigo-600 font-bold">• Serial Tracked</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-brand-gray-900">{inv.warehouseId?.name || 'Primary Depot'}</p>
                            <span className="text-[10px] text-brand-gray-400 font-mono">{inv.warehouseId?.code || 'WH-01'}</span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-black text-emerald-700 text-sm">
                            {inv.availableQuantity}
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-amber-600">
                            {inv.reservedQuantity}
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-blue-600">
                            {inv.soldQuantity}
                          </td>

                          <td className="px-4 py-3.5 text-center font-black text-brand-gray-900">
                            {inv.totalQuantity}
                          </td>

                          <td className="px-4 py-3.5">
                            <StatusBadge status={inv.status} />
                          </td>

                          <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(prod._id || inv.productId);
                                setTargetWhId(inv.warehouseId?._id || inv.warehouseId);
                                setNewTotalQty(inv.totalQuantity);
                                setShowAdjustModal(true);
                                setModalMsg({ type: '', text: '' });
                              }}
                              className="text-[10px] font-bold uppercase px-2 py-1"
                            >
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. Tab Content 2: Serial & IMEI Registry */}
      {activeTab === 'serials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-sm border border-brand-gray-200 shadow-premium">
            <h3 className="text-xs font-black text-brand-gray-900 uppercase">
              Registered Hardware Barcodes ({serials.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setShowSerialModal(true); setModalMsg({ type: '', text: '' }); }}
              className="text-xs uppercase font-bold tracking-wider"
            >
              + Register Serial Barcode
            </Button>
          </div>

          <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Serial Barcode</th>
                  <th className="px-4 py-3.5">IMEI 1 / 2</th>
                  <th className="px-4 py-3.5">Product Model</th>
                  <th className="px-4 py-3.5">Warehouse Depot</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-200">
                {serials.map((s) => (
                  <tr key={s._id} className="hover:bg-brand-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-accent">
                      {s.serialNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-brand-gray-600">
                      {s.imei1 ? `${s.imei1} ${s.imei2 ? `/ ${s.imei2}` : ''}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-gray-900">
                      {s.productId?.name || s.product?.name || 'Hardware Unit'}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-600">
                      {s.warehouseId?.name || 'Main Depot'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-brand-gray-500">
                      {s.sellerOrderId?.orderId || s.assignedOrderId?.orderId || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab Content 3: Warehouse Depots */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div key={wh._id} className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm text-brand-gray-900">{wh.name}</h4>
                  <span className="text-[10px] font-mono font-bold text-brand-accent">{wh.code}</span>
                </div>
                {wh.isPrimary && <Badge variant="success" className="text-[9px] font-bold uppercase">Primary</Badge>}
              </div>

              <div className="text-xs text-brand-gray-600 space-y-1 pt-1 border-t border-brand-gray-100">
                <p>{wh.addressLine1}</p>
                <p>{wh.city}, {wh.state} - {wh.postalCode}</p>
                <p className="text-[10px] text-brand-gray-400">{wh.country}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STOCK IN                                                           */}
      {/* ========================================================================= */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Stock In Physical Units</h3>
              <button onClick={() => setShowStockInModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMsg.text && (
              <div className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
                modalMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleStockInSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Select Product *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {inventory.map((i) => (
                    <option key={i.productId?._id || i._id} value={i.productId?._id || i.productId}>
                      {i.productId?.name} ({i.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Warehouse Depot *</label>
                <select
                  value={targetWhId}
                  onChange={(e) => setTargetWhId(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                >
                  <option value="">Primary Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Quantity to Add *</label>
                <input
                  type="number"
                  min="1"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Stock In Reason</label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowStockInModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Adding...' : 'Confirm Stock In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADJUST STOCK                                                       */}
      {/* ========================================================================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Adjust Inventory Count</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">New Total Physical Count *</label>
                <input
                  type="number"
                  min="0"
                  value={newTotalQty}
                  onChange={(e) => setNewTotalQty(Number(e.target.value))}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Adjustment Reason *</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-semibold"
                >
                  <option value="Physical Count Correction">Physical Count Correction</option>
                  <option value="Damaged Goods Write-off">Damaged Goods Write-off</option>
                  <option value="Lost in Warehouse">Lost in Warehouse</option>
                  <option value="Stock Audit Reconciliation">Stock Audit Reconciliation</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Updating...' : 'Save Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE WAREHOUSE                                                   */}
      {/* ========================================================================= */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Add Warehouse Location</h3>
              <button onClick={() => setShowWarehouseModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWarehouseSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Warehouse Name *</label>
                  <input
                    type="text"
                    value={whForm.name}
                    onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Depot Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. WH-MUM-01"
                    value={whForm.code}
                    onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Address Line 1 *</label>
                <input
                  type="text"
                  value={whForm.addressLine1}
                  onChange={(e) => setWhForm({ ...whForm, addressLine1: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-brand-gray-500 uppercase block">City *</label>
                  <input
                    type="text"
                    value={whForm.city}
                    onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-gray-500 uppercase block">State *</label>
                  <input
                    type="text"
                    value={whForm.state}
                    onChange={(e) => setWhForm({ ...whForm, state: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-brand-gray-500 uppercase block">Pincode *</label>
                  <input
                    type="text"
                    value={whForm.postalCode}
                    onChange={(e) => setWhForm({ ...whForm, postalCode: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-1.5 rounded-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowWarehouseModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Save Warehouse'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK CSV SERIALS                                                   */}
      {/* ========================================================================= */}
      {showBulkSerialModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">Bulk CSV Serial Ingestion</h3>
              <button onClick={() => setShowBulkSerialModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-gray-500">
              Format: <code>SKU, SerialNumber, IMEI1, IMEI2</code> (one per line)
            </p>

            <form onSubmit={handleBulkImportSubmit} className="space-y-3 text-xs">
              <textarea
                rows={6}
                placeholder={`SKU-ROG-G16, SN-ROG-10023, 861234567890123, 861234567890124\nSKU-ROG-G16, SN-ROG-10024`}
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-mono text-[11px]"
                required
              />

              <div className="pt-2 flex justify-end space-x-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkSerialModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Ingesting...' : 'Import Serials'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BrandInventory;
