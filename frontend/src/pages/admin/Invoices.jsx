import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Search, Filter, Calendar, 
  CheckCircle2, ShieldCheck, Eye, ArrowUpDown, 
  Building2, Hash, ExternalLink, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [brandId, setBrandId] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const fetchAdminInvoices = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getAdminInvoices({ search, brandId, status, page, limit: 20 });
      if (res.success) {
        setInvoices(res.invoices || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching admin invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminInvoices();
  }, [search, brandId, status, page]);

  const handleDownloadPdf = async (inv) => {
    try {
      const res = await axiosInstance.get(`/invoices/${inv.invoiceNumber}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${inv.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error downloading invoice PDF.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace GST Tax Invoices & Ledger
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Centralized repository of tax invoices issued by brand sellers with aggregated GST tax breakdown.
          </p>
        </div>
      </div>

      {/* 2. Tax Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Marketplace Gross Invoiced', val: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, color: 'text-brand-gray-900' },
          { label: 'Taxable Turnover', val: `₹${(stats.totalTaxable || 0).toLocaleString('en-IN')}`, color: 'text-brand-accent' },
          { label: 'CGST Collected', val: `₹${(stats.totalCgst || 0).toLocaleString('en-IN')}`, color: 'text-emerald-700' },
          { label: 'SGST Collected', val: `₹${(stats.totalSgst || 0).toLocaleString('en-IN')}`, color: 'text-emerald-700' },
          { label: 'IGST Collected', val: `₹${(stats.totalIgst || 0).toLocaleString('en-IN')}`, color: 'text-blue-700' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">{kpi.label}</span>
            <p className={`text-lg font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Search & Filters */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by invoice number, seller, customer, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:border-brand-accent focus:ring-0 uppercase tracking-wider"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid & Issued</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 4. Invoices Table */}
      {loading ? (
        <div className="bg-white p-6 space-y-4 rounded border">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <FileText className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No invoices found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Invoice Number</th>
                  <th className="px-4 py-3.5">Seller Partner</th>
                  <th className="px-4 py-3.5">Billed Customer</th>
                  <th className="px-4 py-3.5 text-right">Taxable</th>
                  <th className="px-4 py-3.5 text-right">CGST</th>
                  <th className="px-4 py-3.5 text-right">SGST</th>
                  <th className="px-4 py-3.5 text-right">IGST</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-brand-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-bold text-brand-accent">{inv.invoiceNumber}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">
                        {new Date(inv.issuedAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-bold text-brand-gray-900">{inv.sellerDetails?.legalBusinessName || inv.brandId?.name}</p>
                      <span className="text-[10px] font-mono text-brand-gray-400">
                        {inv.sellerDetails?.gstin ? `GST: ${inv.sellerDetails.gstin}` : 'Unregistered'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-brand-gray-900">{inv.customerDetails?.customerName}</p>
                      <span className="text-[10px] text-brand-gray-400">{inv.shippingAddress?.city}, {inv.shippingAddress?.state}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium">
                      ₹{(inv.taxableAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                      ₹{(inv.cgst || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                      ₹{(inv.sgst || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-medium text-blue-700">
                      ₹{(inv.igst || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-brand-gray-900">
                      ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownloadPdf(inv)}
                        className="text-[10px] font-bold uppercase px-2 py-1"
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex justify-between items-center text-xs text-brand-gray-600 font-semibold">
            <span>Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} records</span>
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

    </div>
  );
};

export default AdminInvoices;
