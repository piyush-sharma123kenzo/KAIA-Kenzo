import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Search, Filter, Calendar, 
  CheckCircle2, ShieldCheck, Eye, ArrowUpDown, 
  Building2, Hash, ExternalLink, X
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';

const BrandInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taxSummary, setTaxSummary] = useState({ totalSales: 0, totalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Selected Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchBrandInvoices = async () => {
    setLoading(true);
    try {
      const res = await brandSellerService.getBrandInvoices({ search, status, page, limit: 20 });
      if (res.success) {
        setInvoices(res.invoices || []);
        setTotal(res.total || 0);
        if (res.taxSummary) setTaxSummary(res.taxSummary);
      }
    } catch (err) {
      console.error('Error fetching brand invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandInvoices();
  }, [search, status, page]);

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
            GST Tax Invoices & Sales Ledger
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Immutable tax invoice snapshots issued for your brand's fulfilled hardware orders with itemized GST & HSN codes.
          </p>
        </div>
      </div>

      {/* 2. Tax Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Invoiced Value', val: `₹${(taxSummary.totalSales || 0).toLocaleString('en-IN')}`, color: 'text-brand-gray-900' },
          { label: 'Taxable Turnover', val: `₹${(taxSummary.totalTaxable || 0).toLocaleString('en-IN')}`, color: 'text-brand-accent' },
          { label: 'CGST Collected', val: `₹${(taxSummary.totalCgst || 0).toLocaleString('en-IN')}`, color: 'text-emerald-700' },
          { label: 'SGST Collected', val: `₹${(taxSummary.totalSgst || 0).toLocaleString('en-IN')}`, color: 'text-emerald-700' },
          { label: 'IGST Collected', val: `₹${(taxSummary.totalIgst || 0).toLocaleString('en-IN')}`, color: 'text-blue-700' },
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
            placeholder="Search by invoice number, customer name, customer GSTIN..."
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
            <option value="all">All Invoice Statuses</option>
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
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No tax invoices found</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            Tax invoices are automatically generated when customer orders for your brand are confirmed.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Invoice Number</th>
                  <th className="px-4 py-3.5">Order Ref</th>
                  <th className="px-4 py-3.5">Billed Customer</th>
                  <th className="px-4 py-3.5 text-right">Taxable</th>
                  <th className="px-4 py-3.5 text-right">GST Total</th>
                  <th className="px-4 py-3.5 text-right">Grand Total</th>
                  <th className="px-4 py-3.5">Issue Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {invoices.map((inv) => {
                  const totalTax = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
                  return (
                    <tr key={inv._id} className="hover:bg-brand-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-brand-accent">{inv.invoiceNumber}</p>
                        <span className="text-[10px] text-brand-gray-400 font-mono">ID: {inv.invoiceId}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-mono font-semibold text-brand-gray-900">{inv.sellerOrderId?.orderId || 'N/A'}</p>
                        <span className="text-[10px] text-brand-gray-400 font-mono">Master: {inv.masterOrderId?.orderId || 'N/A'}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-brand-gray-900">{inv.customerDetails?.customerName || 'Customer'}</p>
                        {inv.customerDetails?.customerGSTIN && (
                          <span className="text-[10px] text-brand-accent font-mono block font-bold">
                            GSTIN: {inv.customerDetails.customerGSTIN}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-brand-gray-700">
                        ₹{(inv.taxableAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                        ₹{totalTax.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-brand-gray-900">
                        ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-brand-gray-500 font-mono text-[11px]">
                        {new Date(inv.issuedAt).toLocaleDateString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-[10px] font-bold uppercase px-2 py-1"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>

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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVOICE INSPECTOR                                                  */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border border-brand-gray-200 p-6 space-y-6 text-left">
            
            <div className="flex justify-between items-start border-b border-brand-gray-200 pb-3">
              <div>
                <h3 className="text-base font-black text-brand-gray-900 uppercase">
                  Tax Invoice: {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-brand-gray-500 mt-0.5">
                  Issued on {new Date(selectedInvoice.issuedAt).toLocaleDateString('en-IN')} • Status: {selectedInvoice.invoiceStatus}
                </p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-brand-gray-400 hover:text-brand-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seller & Customer Details */}
            <div className="grid grid-cols-2 gap-4 bg-brand-light p-4 rounded text-xs border border-brand-gray-200">
              <div className="space-y-1">
                <span className="font-bold text-[10px] text-brand-gray-400 uppercase block">Sold By (Seller)</span>
                <p className="font-black text-brand-gray-900">{selectedInvoice.sellerDetails?.legalBusinessName}</p>
                <p className="text-brand-gray-600">{selectedInvoice.sellerDetails?.businessAddress}</p>
                <p className="font-mono text-[11px] font-bold text-brand-accent">GSTIN: {selectedInvoice.sellerDetails?.gstin || 'Not Provided'}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[10px] text-brand-gray-400 uppercase block">Billed & Shipped To</span>
                <p className="font-black text-brand-gray-900">{selectedInvoice.customerDetails?.customerName}</p>
                <p className="text-brand-gray-600">{selectedInvoice.shippingAddress?.addressLine1}, {selectedInvoice.shippingAddress?.city}</p>
                <p className="text-brand-gray-600">{selectedInvoice.shippingAddress?.state} - {selectedInvoice.shippingAddress?.postalCode}</p>
                {selectedInvoice.customerDetails?.customerGSTIN && (
                  <p className="font-mono text-[11px] font-bold text-brand-accent">Buyer GSTIN: {selectedInvoice.customerDetails.customerGSTIN}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-brand-gray-800 uppercase">Itemized Products & Tax Breakdown</h4>
              <div className="border border-brand-gray-200 rounded overflow-hidden">
                <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
                  <thead className="bg-brand-gray-50 text-[10px] uppercase font-bold text-brand-gray-500">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">HSN</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gray-200">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-brand-gray-900">{it.productName}</td>
                        <td className="p-2 font-mono text-[11px]">{it.hsnCode || '8517'}</td>
                        <td className="p-2 text-center font-bold">{it.quantity}</td>
                        <td className="p-2 text-right font-medium">₹{it.taxableAmount?.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-right font-medium text-emerald-700">₹{it.taxAmount?.toLocaleString('en-IN')} ({it.taxRate}%)</td>
                        <td className="p-2 text-right font-black">₹{it.lineTotal?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="border-t pt-3 flex justify-end">
              <div className="w-64 text-xs space-y-1 text-right">
                <div className="flex justify-between">
                  <span className="text-brand-gray-500">Taxable Value:</span>
                  <span className="font-bold">₹{selectedInvoice.taxableAmount?.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.igst > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-brand-gray-500">IGST:</span>
                    <span className="font-bold text-emerald-700">₹{selectedInvoice.igst?.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-brand-gray-500">CGST:</span>
                      <span className="font-bold text-emerald-700">₹{selectedInvoice.cgst?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-gray-500">SGST:</span>
                      <span className="font-bold text-emerald-700">₹{selectedInvoice.sgst?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-1 font-black text-sm text-brand-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-brand-accent">₹{selectedInvoice.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="text-xs uppercase font-bold"
              >
                <Download className="w-4 h-4 mr-1" /> Download Official PDF
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BrandInvoices;
