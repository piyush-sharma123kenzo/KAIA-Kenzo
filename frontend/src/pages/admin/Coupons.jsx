import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Search, Filter, CheckCircle, XCircle, 
  Clock, DollarSign, Percent, AlertCircle, X, Check 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderValue: 1000,
    maximumDiscount: 500,
    usageLimit: 500,
    fundingType: 'marketplace-funded',
    endDate: '',
  });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminCoupons();
      if (res.success) {
        setCoupons(res.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue || !formData.endDate) {
      setFormMsg({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      const res = await brandSellerService.createAdminCoupon(formData);
      if (res.success) {
        setFormMsg({ type: 'success', text: 'Coupon created successfully!' });
        setTimeout(() => {
          setShowCreateModal(false);
          fetchCoupons();
        }, 1000);
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Error creating coupon.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCouponStatus = async (coupon) => {
    const nextStatus = coupon.status === 'active' ? 'disabled' : 'active';
    try {
      await brandSellerService.updateAdminCoupon(coupon._id, { status: nextStatus, isActive: nextStatus === 'active' });
      fetchCoupons();
    } catch (err) {
      alert('Error updating coupon status.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Promotional Coupons & Voucher Funding
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Configure platform & brand-funded discount campaigns, usage limits, and redemption thresholds.
          </p>
        </div>

        <Button onClick={() => { setShowCreateModal(true); setFormMsg({ type: '', text: '' }); }} size="sm" className="text-xs uppercase font-bold flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </Button>
      </div>

      {/* 2. Coupons List */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Tag className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No active promotional coupons</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Discount</th>
                  <th className="px-4 py-3.5">Min Order / Cap</th>
                  <th className="px-4 py-3.5">Funding Allocation</th>
                  <th className="px-4 py-3.5">Usage Count</th>
                  <th className="px-4 py-3.5">Expiry Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-gray-50/70 font-medium">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-brand-dark bg-brand-light px-2 py-0.5 border rounded">
                        {c.code}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-black text-brand-gray-900">
                      {c.discountType === 'percentage' || c.type === 'PERCENTAGE' ? `${c.discountValue || c.value}% OFF` : `₹${c.discountValue || c.value} FLAT`}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-600">
                      Min: ₹{c.minimumOrderValue || c.minOrderAmount || 0} • Cap: {c.maximumDiscount ? `₹${c.maximumDiscount}` : 'None'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                        {c.fundingType || 'marketplace-funded'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-brand-gray-700">
                      {c.usedCount || 0} / {c.usageLimit || 1000}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-500">
                      {c.endDate || c.expiryDate ? new Date(c.endDate || c.expiryDate).toLocaleDateString('en-IN') : 'Ongoing'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        c.status === 'active' || c.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-brand-gray-100 text-brand-gray-600'
                      }`}>
                        {c.status || (c.isActive ? 'active' : 'disabled')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCouponStatus(c)}
                        className="text-[10px] uppercase font-bold py-1 px-2"
                      >
                        {c.status === 'active' || c.isActive ? 'Disable' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-premium max-w-lg w-full p-6 space-y-4 border border-brand-gray-200">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="font-black text-sm text-brand-gray-900 uppercase">Create New Promo Coupon</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-gray-400 hover:text-brand-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMsg.text && (
              <div className={`p-3 rounded text-xs font-bold ${formMsg.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KAIA500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumOrderValue}
                    onChange={(e) => setFormData({ ...formData, minimumOrderValue: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Funding Allocation</label>
                  <select
                    value={formData.fundingType}
                    onChange={(e) => setFormData({ ...formData, fundingType: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-bold"
                  >
                    <option value="marketplace-funded">Marketplace Funded (100%)</option>
                    <option value="brand-funded">Brand Partner Funded</option>
                    <option value="shared">Shared (50/50)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-brand-gray-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCoupons;
