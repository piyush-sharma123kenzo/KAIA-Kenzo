import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, Building2, Check, X, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [commissionOverride, setCommissionOverride] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approve' or 'Reject'
  const [processing, setProcessing] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/brands');
      if (res.data.success) {
        setBrands(res.data.brands);
      }
    } catch (err) {
      console.error('Error fetching brand registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenAction = (brand, type) => {
    setSelectedBrand(brand);
    setActionType(type);
    setCommissionOverride(brand.commissionOverride?.toString() || '');
    setRejectionReason('');
  };

  const handleProcessAction = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const status = actionType === 'Approve' ? 'Approved' : 'Rejected';
      const payload = {
        status,
        commissionOverride: commissionOverride !== '' ? Number(commissionOverride) : null,
        rejectionReason: actionType === 'Reject' ? rejectionReason : '',
      };

      const res = await axiosInstance.put(`/admin/brands/${selectedBrand._id}/approve`, payload);
      if (res.data.success) {
        alert(res.data.message);
        setSelectedBrand(null);
        fetchBrands(); // Refresh listing
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action execution failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendBrand = async (brandId, currentStatus) => {
    const nextStatus = currentStatus === 'Suspended' ? 'Approved' : 'Suspended';
    if (!window.confirm(`Are you sure you want to set brand status to ${nextStatus}?`)) return;

    try {
      const res = await axiosInstance.put(`/admin/brands/${brandId}/approve`, { status: nextStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchBrands();
      }
    } catch (err) {
      alert('Error toggling suspension.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading brand applications...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Brand Registrations</h2>
        <p className="text-xs text-brand-gray-500">Audit company credentials, GST filings, bank payouts, and approve partnerships.</p>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white border p-12 text-center text-brand-gray-500">No brand registrations found.</div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
            <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Brand details</th>
                <th className="px-6 py-4">Contact Owner</th>
                <th className="px-6 py-4">Tax IDs</th>
                <th className="px-6 py-4">Settlement Bank</th>
                <th className="px-6 py-4">Comm. Override</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y text-brand-gray-700">
              {brands.map((b) => (
                <tr key={b._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-gray-900">{b.name}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">Slug: {b.slug}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <p>{b.owner?.name || 'Owner unlinked'}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">{b.contactEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>GST: {b.businessDetails?.gstin || 'N/A'}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">PAN: {b.businessDetails?.pan || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{b.bankDetails?.bankName}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">A/C: {b.bankDetails?.accountNumber}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-brand-accent">
                    {b.commissionOverride !== null ? `${b.commissionOverride}%` : 'Category default'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                      b.status === 'Pending' ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {b.status === 'Pending' && (
                      <div className="flex space-x-1.5 justify-end">
                        <button
                          onClick={() => handleOpenAction(b, 'Approve')}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAction(b, 'Reject')}
                          className="bg-red-650 hover:bg-red-700 text-white p-1 rounded-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {b.status === 'Approved' && (
                      <button
                        onClick={() => handleSuspendBrand(b._id, b.status)}
                        className="text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Suspend
                      </button>
                    )}

                    {b.status === 'Suspended' && (
                      <button
                        onClick={() => handleSuspendBrand(b._id, b.status)}
                        className="text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve/Reject Overlay Drawer Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden text-left">
            <div className="bg-brand-gray-50 px-6 py-4 border-b border-brand-gray-200 flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase">
                {actionType} Brand Partner: {selectedBrand.name}
              </h3>
              <button onClick={() => setSelectedBrand(null)} className="text-brand-gray-400 hover:text-brand-gray-900">
                Cancel
              </button>
            </div>

            <form onSubmit={handleProcessAction} className="p-6 space-y-4 text-xs">
              {actionType === 'Approve' ? (
                <div className="space-y-4">
                  <p className="text-brand-gray-600 leading-relaxed">
                    Set a platform commission override for this brand partner. If left blank, category-level commissions (e.g. 5.0%) will apply.
                  </p>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-brand-gray-650">Commission Override Percentage (%):</label>
                    <input
                      type="number"
                      placeholder="e.g. 4.0"
                      value={commissionOverride}
                      onChange={(e) => setCommissionOverride(e.target.value)}
                      className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-brand-gray-650">State Rejection Comment:</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Missing bank verification documents or incorrect GSTIN details..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedBrand(null)}
                  className="flex-1 border border-brand-gray-300 py-2.5 rounded text-xs font-semibold hover:bg-brand-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-brand-dark hover:bg-brand-gray-850 text-white py-2.5 rounded text-xs font-semibold transition-colors"
                >
                  {processing ? 'Processing...' : `Confirm ${actionType}`}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Brands;
