import React, { useState, useEffect } from 'react';
import { 
  Percent, PlusCircle, Filter, Search, Check, 
  X, AlertCircle, ShieldCheck, ChevronRight, Edit3 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminCommissions = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState('all');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [brands, setBrands] = useState([]);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    scope: 'marketplace_default',
    brandId: '',
    commissionType: 'percentage',
    commissionValue: 5,
    commissionTaxRate: 18,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const [ruleRes, brandRes] = await Promise.all([
        brandSellerService.getCommissionRules({ scope: scopeFilter }),
        brandSellerService.getAdminSettlements(), // or brands list
      ]);

      if (ruleRes.success) setRules(ruleRes.rules || []);
    } catch (err) {
      console.error('Error fetching commission rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [scopeFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!ruleForm.name.trim() || !ruleForm.commissionValue) return;

    setSubmitting(true);
    try {
      const res = await brandSellerService.createCommissionRule(ruleForm);
      if (res.success) {
        alert('Commission rule created successfully.');
        setShowCreateModal(false);
        setRuleForm({
          name: '',
          scope: 'marketplace_default',
          brandId: '',
          commissionType: 'percentage',
          commissionValue: 5,
          commissionTaxRate: 18,
        });
        fetchRules();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating commission rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const res = await brandSellerService.updateCommissionRule(rule._id, {
        isActive: !rule.isActive,
      });
      if (res.success) {
        fetchRules();
      }
    } catch (err) {
      alert('Error updating rule status.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Commission Rules & Take-Rates
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Configure hierarchical commission policies (Product &gt; Brand &gt; Category &gt; Marketplace Default).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/admin/revenue">
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider">
              Revenue Analytics
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Rule</span>
          </Button>
        </div>
      </div>

      {/* 2. Priority Hierarchy Explainer Ribbon */}
      <div className="bg-brand-light border border-brand-gray-200 p-4 rounded-sm flex items-center justify-between text-xs font-bold text-brand-gray-700">
        <span className="uppercase tracking-wider text-brand-gray-500">Evaluation Priority:</span>
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="bg-white px-2 py-0.5 rounded border text-brand-accent font-black">1. Product Rule</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-gray-400" />
          <span className="bg-white px-2 py-0.5 rounded border text-indigo-700 font-bold">2. Brand Partner Rule</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-gray-400" />
          <span className="bg-white px-2 py-0.5 rounded border text-blue-700 font-bold">3. Category Rule</span>
          <ChevronRight className="w-3.5 h-3.5 text-brand-gray-400" />
          <span className="bg-white px-2 py-0.5 rounded border text-brand-gray-900">4. Marketplace Default</span>
        </div>
      </div>

      {/* 3. Scope Filter Tabs */}
      <div className="flex space-x-2 border-b border-brand-gray-200 overflow-x-auto">
        {[
          { key: 'all', label: 'All Rules' },
          { key: 'marketplace_default', label: 'Marketplace Default' },
          { key: 'brand', label: 'Brand Rules' },
          { key: 'category', label: 'Category Rules' },
          { key: 'product', label: 'Product Rules' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setScopeFilter(tab.key)}
            className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              scopeFilter === tab.key
                ? 'border-brand-accent text-brand-accent font-black'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Commission Rules Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Percent className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No commission rules configured</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Rule Name</th>
                  <th className="px-4 py-3.5">Scope</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5 text-right">Commission Rate</th>
                  <th className="px-4 py-3.5 text-right">Tax on Fee</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Toggle Active</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {rules.map((r) => (
                  <tr key={r._id} className="hover:bg-brand-gray-50/70 transition-colors font-medium">
                    <td className="px-4 py-3.5 font-bold text-brand-gray-900">
                      {r.name}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-brand-light text-brand-gray-700">
                        {r.scope?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-700">
                      {r.brandId?.name || r.categoryId?.name || r.productId?.name || 'All Catalog'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-indigo-700 text-sm">
                      {r.commissionType === 'percentage' ? `${r.commissionValue}%` : `₹${r.commissionValue}`}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-brand-gray-500 font-bold">
                      {r.commissionTaxRate}% GST
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-brand-gray-100 text-brand-gray-500'
                      }`}>
                        {r.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border transition-colors ${
                          r.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {r.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE COMMISSION RULE                                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-brand-gray-900 uppercase">
                Create Commission Rule
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Marketplace 5%"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">Scope *</label>
                <select
                  value={ruleForm.scope}
                  onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold text-xs"
                >
                  <option value="marketplace_default">Marketplace Default</option>
                  <option value="brand">Brand Specific</option>
                  <option value="category">Category Specific</option>
                  <option value="product">Product Specific</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Commission Value *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={ruleForm.commissionValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, commissionValue: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-brand-gray-700 uppercase">Type *</label>
                  <select
                    value={ruleForm.commissionType}
                    onChange={(e) => setRuleForm({ ...ruleForm, commissionType: e.target.value })}
                    className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-bold text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-brand-gray-700 uppercase">GST Tax on Platform Fee (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={ruleForm.commissionTaxRate}
                  onChange={(e) => setRuleForm({ ...ruleForm, commissionTaxRate: e.target.value })}
                  className="w-full bg-brand-light border border-brand-gray-250 p-2 rounded-sm font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCommissions;
