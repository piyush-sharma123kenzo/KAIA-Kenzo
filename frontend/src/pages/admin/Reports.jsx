import React, { useState } from 'react';
import { 
  FileText, Download, ShoppingBag, Package, 
  Users, DollarSign, RotateCcw, Truck, Layers, CheckCircle2, AlertCircle 
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import Button from '../../components/ui/Button';

const AdminReports = () => {
  const [downloading, setDownloading] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const exportDatasets = [
    { key: 'orders', title: 'Master Orders & Line Items', desc: 'Complete historical transaction records, addresses, and settlement statuses.', icon: ShoppingBag },
    { key: 'products', title: 'Catalog Products & Pricing', desc: 'SKU database, active brand inventory, GST rates, and approval states.', icon: Package },
    { key: 'customers', title: 'Customer & User Accounts', desc: 'Buyer directory, contact info, and registration metadata.', icon: Users },
    { key: 'settlements', title: 'Seller Financial Settlements', desc: 'Marketplace commission, gross sales, payouts, and ledger statements.', icon: DollarSign },
  ];

  const handleDownload = async (key) => {
    setDownloading(key);
    setMsg({ type: '', text: '' });
    try {
      const blob = await brandSellerService.exportCsv(key);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kaia_${key}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMsg({ type: 'success', text: `Downloaded ${key} CSV successfully.` });
    } catch (err) {
      setMsg({ type: 'error', text: 'Error generating CSV dataset.' });
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Reports & Enterprise Data Exports
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Export unmasked, sanitized analytical datasets directly from MongoDB for tax audits, BI tools, and reporting.
          </p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-sm border text-xs font-bold ${
          msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {msg.text}
        </div>
      )}

      {/* 2. Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportDatasets.map((ds) => {
          const Icon = ds.icon;
          return (
            <div key={ds.key} className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-brand-light rounded border border-brand-gray-200 text-brand-accent">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-brand-gray-900 uppercase">{ds.title}</h3>
                  <p className="text-xs text-brand-gray-500 mt-1">{ds.desc}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-brand-gray-400 font-mono uppercase font-bold">Format: .CSV</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(ds.key)}
                  disabled={downloading === ds.key}
                  className="text-xs uppercase font-bold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading === ds.key ? 'Exporting...' : 'Download CSV'}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AdminReports;
