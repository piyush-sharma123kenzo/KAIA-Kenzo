import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Package, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Truck, RefreshCw, XCircle, 
  Building2, QrCode, FileText, Check, X, ShieldAlert, 
  Search, Filter, CheckSquare, Sparkles 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const BrandReturns = () => {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, requested: 0, approved: 0, inspection_pending: 0, refunded: 0, replacement_shipped: 0, rejected: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReceivedModal, setShowReceivedModal] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [inspectionForm, setInspectionForm] = useState({
    serialMatched: true,
    packagingCondition: 'good',
    accessoriesComplete: true,
    physicalDamage: false,
    functionalTest: 'passed',
    inspectionNotes: '',
    failureReason: '',
    decision: 'passed',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturnsData = async () => {
    setLoading(true);
    try {
      const [retRes, whRes] = await Promise.all([
        brandSellerService.getReturns({ search, status: statusFilter, page, limit: 20 }),
        brandSellerService.getWarehouses(),
      ]);

      if (retRes.success) {
        setReturns(retRes.returns || []);
        setTotal(retRes.total || 0);
        if (retRes.stats) setStats(retRes.stats);
      }
      if (whRes.success) setWarehouses(whRes.warehouses || []);
    } catch (err) {
      console.error('Error fetching brand returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsData();
  }, [search, statusFilter, page]);

  // Handle Approve
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturn) return;
    setActionLoading(true);

    try {
      const res = await brandSellerService.approveReturn(selectedReturn._id, {
        returnWarehouseId: selectedWarehouse || undefined,
      });
      if (res.success) {
        alert(res.message);
        setShowApproveModal(false);
        fetchReturnsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving return.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturn || !rejectionReason.trim()) return;
    setActionLoading(true);

    try {
      const res = await brandSellerService.rejectReturn(selectedReturn._id, rejectionReason.trim());
      if (res.success) {
        alert(res.message);
        setShowRejectModal(false);
        fetchReturnsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting return.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Received
  const handleMarkReceivedSubmit = async () => {
    if (!selectedReturn) return;
    setActionLoading(true);

    try {
      const res = await brandSellerService.markReturnReceived(selectedReturn._id, selectedWarehouse || undefined);
      if (res.success) {
        alert(res.message);
        setShowReceivedModal(false);
        fetchReturnsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking return received.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Hardware Inspection
  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturn) return;
    setActionLoading(true);

    try {
      const res = await brandSellerService.inspectReturn(selectedReturn._id, {
        inspectionData: inspectionForm,
        decision: inspectionForm.decision,
      });

      if (res.success) {
        alert(res.message || 'Inspection completed successfully.');
        setShowInspectModal(false);
        fetchReturnsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting inspection.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Returns, Replacements & RMA Inspections
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Process customer return requests for your brand, manage reverse logistics, and perform hardware testing.
          </p>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total RMA Requests', val: stats.total, color: 'text-brand-gray-900' },
          { label: 'Needs Review', val: stats.requested, color: 'text-amber-600' },
          { label: 'Pickup Scheduled', val: stats.approved, color: 'text-blue-600' },
          { label: 'Testing Desk', val: stats.inspection_pending, color: 'text-indigo-600' },
          { label: 'Refunded / Replaced', val: (stats.refunded || 0) + (stats.replacement_shipped || 0), color: 'text-emerald-600' },
          { label: 'Rejected', val: stats.rejected, color: 'text-red-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex space-x-2 border-b border-brand-gray-200">
        {[
          { key: 'all', label: 'All Returns' },
          { key: 'requested', label: 'Needs Approval' },
          { key: 'approved', label: 'In Reverse Transit' },
          { key: 'inspection_pending', label: 'At Testing Desk' },
          { key: 'refunded', label: 'Refunded / Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              statusFilter === tab.key
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Search Bar */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by return number, customer, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* 5. Returns Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <RotateCcw className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No return requests found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Return Ref</th>
                  <th className="px-4 py-3.5">Order Ref</th>
                  <th className="px-4 py-3.5">Product & Serials</th>
                  <th className="px-4 py-3.5">Customer & Reason</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">RMA Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {returns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-brand-accent">{ret.returnNumber}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">
                        {new Date(ret.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-semibold text-brand-gray-900">
                      {ret.sellerOrderId?.orderId || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5">
                      {ret.items?.map((it, idx) => (
                        <div key={idx}>
                          <p className="font-bold text-brand-gray-900">{it.productName} (x{it.quantity})</p>
                          {it.serialNumbers && it.serialNumbers.length > 0 && (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">
                              SN: {it.serialNumbers.join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-brand-gray-900">{ret.customerId?.name || 'Customer'}</p>
                      <span className="text-[10px] text-brand-gray-500 font-bold uppercase block">
                        Reason: {ret.reason?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge variant={ret.returnType === 'refund' ? 'primary' : 'success'} className="text-[10px] uppercase font-bold">
                        {ret.returnType}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={ret.status} />
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Status-dependent RMA action buttons */}
                      {['requested', 'under_review'].includes(ret.status) && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { setSelectedReturn(ret); setShowApproveModal(true); }}
                            className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedReturn(ret); setShowRejectModal(true); setRejectionReason(''); }}
                            className="text-[10px] font-bold uppercase px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {['approved', 'pickup_scheduled', 'pickup_in_transit'].includes(ret.status) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setSelectedReturn(ret); setShowReceivedModal(true); }}
                          className="text-[10px] font-bold uppercase px-2 py-1 flex items-center space-x-1"
                        >
                          <Truck className="w-3 h-3 mr-1" /> Mark Received
                        </Button>
                      )}

                      {['received', 'inspection_pending'].includes(ret.status) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(ret);
                            setShowInspectModal(true);
                            setInspectionForm({
                              serialMatched: true,
                              packagingCondition: 'good',
                              accessoriesComplete: true,
                              physicalDamage: false,
                              functionalTest: 'passed',
                              inspectionNotes: '',
                              failureReason: '',
                              decision: 'passed',
                            });
                          }}
                          className="text-[10px] font-bold uppercase px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1"
                        >
                          <CheckSquare className="w-3 h-3 mr-1" /> Test & Resolve
                        </Button>
                      )}

                      {['refunded', 'replacement_shipped', 'completed', 'rejected'].includes(ret.status) && (
                        <Badge variant="neutral" className="text-[10px] font-mono">
                          Resolved
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPROVE RETURN                                                     */}
      {/* ========================================================================= */}
      {showApproveModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">
                Approve Return #{selectedReturn.returnNumber}
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-3 text-xs">
              <p className="text-brand-gray-600">
                Approve return request for <strong>{selectedReturn.items[0]?.productName}</strong>. A reverse courier pickup will be scheduled from customer address.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Receiving Warehouse Depot</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold"
                >
                  <option value="">Primary Warehouse Depot</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowApproveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? 'Approving...' : 'Confirm & Schedule Pickup'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT RETURN                                                      */}
      {/* ========================================================================= */}
      {showRejectModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">
                Reject Return #{selectedReturn.returnNumber}
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Physical customer damage, missing warranty serial..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-medium"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK RECEIVED                                                      */}
      {/* ========================================================================= */}
      {showReceivedModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">
                Confirm Arrival at Warehouse
              </h3>
              <button onClick={() => setShowReceivedModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-gray-600">
              Confirm that return package <strong>#{selectedReturn.returnNumber}</strong> has been delivered to your depot and is ready for the testing workbench.
            </p>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowReceivedModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" disabled={actionLoading} onClick={handleMarkReceivedSubmit}>
                {actionLoading ? 'Marking...' : 'Confirm Arrival'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HARDWARE INSPECTION & RESOLUTION                                   */}
      {/* ========================================================================= */}
      {showInspectModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-5 text-left">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-base font-black text-brand-gray-900 uppercase">
                  Hardware Inspection: #{selectedReturn.returnNumber}
                </h3>
                <p className="text-xs text-brand-gray-500 mt-0.5">
                  Resolution Mode: <strong className="uppercase text-brand-accent">{selectedReturn.returnType}</strong>
                </p>
              </div>
              <button onClick={() => setShowInspectModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
              
              {/* Inspection Checklist */}
              <div className="space-y-2 bg-brand-light p-4 rounded border border-brand-gray-200">
                <h4 className="font-black text-brand-gray-800 uppercase">Workbench Quality Checklist:</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inspectionForm.serialMatched}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, serialMatched: e.target.checked })}
                      className="rounded text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="font-semibold text-brand-gray-800">1. Serial Number / IMEI barcode matches original order</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inspectionForm.accessoriesComplete}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, accessoriesComplete: e.target.checked })}
                      className="rounded text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="font-semibold text-brand-gray-800">2. All factory cables, manuals, and accessories enclosed</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!inspectionForm.physicalDamage}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, physicalDamage: !e.target.checked })}
                      className="rounded text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="font-semibold text-brand-gray-800">3. No unauthorized physical tampering or customer drop damage</span>
                  </label>
                </div>
              </div>

              {/* Decision */}
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-800 uppercase">Inspection Result & Final Decision *</label>
                <select
                  value={inspectionForm.decision}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, decision: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold text-xs"
                >
                  <option value="passed">
                    Passed — {selectedReturn.returnType === 'refund' ? 'Execute Gateway Refund' : 'Dispatch Factory Replacement'}
                  </option>
                  <option value="failed">Failed — Reject Return (Customer Damage / Tampering)</option>
                </select>
              </div>

              {inspectionForm.decision === 'failed' && (
                <div className="space-y-1">
                  <label className="font-bold text-red-700 uppercase">Failure Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serial barcode mismatched or water damage detected"
                    value={inspectionForm.failureReason}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, failureReason: e.target.value })}
                    className="w-full bg-red-50 border border-red-200 p-2 rounded-sm text-xs font-semibold text-red-800"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Inspection Notes</label>
                <textarea
                  rows={2}
                  value={inspectionForm.inspectionNotes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionNotes: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm"
                  placeholder="Optional workbench notes..."
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInspectModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading}
                  className={`text-xs uppercase font-bold ${
                    inspectionForm.decision === 'failed' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {actionLoading ? 'Processing...' : inspectionForm.decision === 'failed' ? 'Reject Return' : 'Execute Resolution'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BrandReturns;
