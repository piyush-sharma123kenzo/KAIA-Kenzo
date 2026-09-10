import React, { useState, useEffect } from 'react';
import { 
  Sliders, ShieldCheck, Database, CreditCard, Truck, 
  FileText, Bell, CheckCircle2, Lock, Save, RefreshCw, AlertTriangle
} from 'lucide-react';
import adminService from '../../services/adminService';
import Container from '../../components/ui/Container';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [config, setConfig] = useState({
    siteName: 'KAIA Technologies Marketplace',
    supportEmail: 'kenzoinfosystemsprivatelimited@gmail.com',
    supportPhone: '+91 9811207024',
    currency: 'INR (₹)',
    taxSettings: {
      defaultGstRate: 18,
      pricesIncludeTax: true,
    },
    deliverySettings: {
      radiusKm: 10,
      standardDeliveryFee: 99,
      freeShippingThreshold: 5000,
    },
    orderSettings: {
      returnWindowDays: 7,
      autoCancelUnpaidMinutes: 30,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await adminService.getSettings();
        if (res.success && res.settings) {
          const s = res.settings;
          setConfig({
            siteName: s.siteName || 'KAIA Technologies Marketplace',
            supportEmail: s.supportEmail || 'kenzoinfosystemsprivatelimited@gmail.com',
            supportPhone: s.supportPhone || '+91 9811207024',
            currency: 'INR (₹)',
            taxSettings: {
              defaultGstRate: s.taxSettings?.defaultGstRate ?? 18,
              pricesIncludeTax: s.taxSettings?.pricesIncludeTax ?? true,
            },
            deliverySettings: {
              radiusKm: s.deliverySettings?.radiusKm ?? 10,
              standardDeliveryFee: s.deliverySettings?.standardDeliveryFee ?? 99,
              freeShippingThreshold: s.deliverySettings?.freeShippingThreshold ?? 5000,
            },
            orderSettings: {
              returnWindowDays: s.orderSettings?.returnWindowDays ?? 7,
              autoCancelUnpaidMinutes: s.orderSettings?.autoCancelUnpaidMinutes ?? 30,
            },
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await adminService.updateSettings(config);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Control Settings
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Global marketplace policies, financial thresholds, tax parameters, and carrier integration status.
          </p>
        </div>

        <Button onClick={handleSave} className="flex items-center space-x-2 text-xs uppercase font-bold">
          <Save className="w-3.5 h-3.5" />
          <span>Save Configuration</span>
        </Button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-sm flex items-center space-x-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Marketplace settings updated successfully. Changes applied in real-time.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Marketplace & Business Policies */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-gray-200 pb-3">
            <Sliders className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-black text-brand-gray-900 uppercase">Core Platform Parameters</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-brand-gray-600 font-bold block mb-1">Marketplace Legal Name</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Platform Support Email</label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Platform Support Phone</label>
                <input
                  type="text"
                  value={config.supportPhone}
                  onChange={(e) => setConfig({ ...config, supportPhone: e.target.value })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Base Currency</label>
                <input
                  type="text"
                  disabled
                  value={config.currency}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs bg-brand-light font-mono"
                />
              </div>

              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Return Window (Days)</label>
                <input
                  type="number"
                  value={config.orderSettings.returnWindowDays}
                  onChange={(e) => setConfig({
                    ...config,
                    orderSettings: { ...config.orderSettings, returnWindowDays: parseInt(e.target.value, 10) || 7 },
                  })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Financial & Taxation Rules */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-gray-200 pb-3">
            <CreditCard className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-black text-brand-gray-900 uppercase">Taxation & Delivery Radius</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  value={config.taxSettings.defaultGstRate}
                  onChange={(e) => setConfig({
                    ...config,
                    taxSettings: { ...config.taxSettings, defaultGstRate: parseInt(e.target.value, 10) || 18 },
                  })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Delivery Radius (KM)</label>
                <input
                  type="number"
                  value={config.deliverySettings.radiusKm}
                  onChange={(e) => setConfig({
                    ...config,
                    deliverySettings: { ...config.deliverySettings, radiusKm: parseInt(e.target.value, 10) || 10 },
                  })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Free Shipping Above (₹)</label>
                <input
                  type="number"
                  value={config.deliverySettings.freeShippingThreshold}
                  onChange={(e) => setConfig({
                    ...config,
                    deliverySettings: { ...config.deliverySettings, freeShippingThreshold: parseInt(e.target.value, 10) || 5000 },
                  })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-brand-gray-600 font-bold block mb-1">Standard Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={config.deliverySettings.standardDeliveryFee}
                  onChange={(e) => setConfig({
                    ...config,
                    deliverySettings: { ...config.deliverySettings, standardDeliveryFee: parseInt(e.target.value, 10) || 99 },
                  })}
                  className="w-full p-2.5 border border-brand-gray-200 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-brand-gray-500 block leading-relaxed">
                * GST input credit calculations automatically route between CGST/SGST (intra-state Karnataka) and IGST (inter-state dispatches) using buyer PIN codes.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Security & Gateway Status */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-gray-200 pb-3">
            <Lock className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-black text-brand-gray-900 uppercase">Payment & Security Status</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Razorpay Gateway Integration</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">Configured</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Webhook Cryptographic Verification</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">HMAC-SHA256 Active</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Session Expiration</span>
              <span className="font-mono text-brand-gray-900 font-bold">24 Hours</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-brand-gray-600">Audit Trail Immutability</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">Enforced</span>
            </div>
          </div>
        </div>

        {/* Card 4: Logistics & Carrier Webhook Status */}
        <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-gray-200 pb-3">
            <Truck className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-black text-brand-gray-900 uppercase">Logistics & Carrier Status</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Blue Dart Express</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">Active</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Shiprocket Multi-Carrier</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">Active</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-100">
              <span className="text-brand-gray-600">Delhivery Surface</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">Active</span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-brand-gray-600">PIN Code Serviceability Engine</span>
              <span className="font-mono text-brand-gray-900 font-bold">27,000+ PIN Codes</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
