import React, { useState, useEffect } from 'react';
import { 
  Landmark, DollarSign, CheckCircle2, Clock, 
  ShieldCheck, Download, PlusCircle, X, ChevronRight, FileText, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Generate Settlement Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Detail Modal
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const fetchSettlementsData = async () => {
    setLoading(true);
    try {
      const [settleRes, brandListRes] = await Promise.all([
        brandSellerService.getAdminSettlements({ status: statusFilter }),
        brandSellerService.getReturns(), // we can fetch brands from returns or auth
      ]);

      if (settleRes.success) {
        setSettlements(settleRes.settlements || []);
        setTotal(settleRes.total || 0);
      }
    } catch (err) {
      console.error('Error fetching admin settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlementsData();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this settlement statement for payout disbursement?')) return;
    setActionLoading(true);
    try {
      const res = await brandSellerService.approveSettlement(id);
      if (res.success) {
        alert('Settlement approved.');
        fetchSettlementsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving settlement.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayout = async (id) => {
    if (!window.confirm('Disburse payout to brand seller account?')) return;
    setActionLoading(true);
    try {
      const res = await brandSellerService.processSettlement(id, 'mock');
      if (res.success) {
        alert(res.message || 'Payout processed successfully.');
        fetchSettlementsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing payout.');
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
            Marketplace Settlement & Payout Control Station
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Audit seller payout eligibility, approve periodic statements, and disburse bank settlements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/admin/revenue">
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold tracking-wider">
              Revenue Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Status Filter Tabs */}
      <div className="flex space-x-2 border-b border-brand-gray-200 overflow-x-auto">
        {[
          { key: 'all', label: 'All Statements' },
          { key: 'pending', label: 'Pending Approval' },
          { key: 'approved', label: 'Approved (Ready to Disburse)' },
          { key: 'paid', label: 'Disbursed / Paid' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`py-2 px-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              statusFilter === tab.key
                ? 'border-brand-accent text-brand-accent font-black'
                : 'border-transparent text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Settlements Table */}
      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : settlements.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Landmark className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No settlement batches found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Statement ID</th>
                  <th className="px-4 py-3.5">Brand Partner</th>
                  <th className="px-4 py-3.5 text-right">Gross Sales</th>
                  <th className="px-4 py-3.5 text-right">Commission</th>
                  <th className="px-4 py-3.5 text-right">Refunds</th>
                  <th className="px-4 py-3.5 text-right">Net Payable</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Disbursement Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {settlements.map((st) => (
                  <tr key={st._id} className="hover:bg-brand-gray-50/70 transition-colors font-medium">
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-brand-accent">{st.settlementNumber}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">
                        {new Date(st.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold uppercase text-brand-gray-900">
                      {st.brandId?.name || 'Brand Partner'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-brand-gray-900">
                      ₹{st.grossSales?.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-indigo-700 font-bold">
                      -₹{st.commission?.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-red-600 font-bold">
                      {st.refunds > 0 ? `-₹${st.refunds.toLocaleString('en-IN')}` : '₹0'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      ₹{st.netPayable?.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={st.status} />
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {st.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleApprove(st._id)}
                          className="text-[10px] font-bold uppercase px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Approve Payout
                        </Button>
                      )}

                      {st.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleProcessPayout(st._id)}
                          className="text-[10px] font-bold uppercase px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Disburse Funds
                        </Button>
                      )}

                      {st.status === 'paid' && (
                        <Badge variant="success" className="text-[10px] font-mono">
                          Disbursed
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

    </div>
  );
};

export default AdminSettlements;
