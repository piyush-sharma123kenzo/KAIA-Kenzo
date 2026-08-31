import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, CheckCircle2, ShieldCheck, Globe, Mail, Phone, 
  MapPin, Landmark, AlertCircle, Save, ExternalLink
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { AuthContext } from '../../context/AuthContext';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const BrandProfile = () => {
  const { user } = useContext(AuthContext);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    businessDetails: {
      gstin: '',
      pan: '',
      address: '',
    },
    bankDetails: {
      accountNumber: '',
      ifsc: '',
      bankName: '',
    },
  });

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await brandSellerService.getProfile();
      if (res.success && res.brand) {
        const b = res.brand;
        setBrand(b);
        setForm({
          name: b.name || '',
          description: b.description || '',
          logo: b.logo || '',
          banner: b.banner || '',
          website: b.website || '',
          contactEmail: b.contactEmail || user?.email || '',
          contactPhone: b.contactPhone || '',
          businessDetails: {
            gstin: b.businessDetails?.gstin || '',
            pan: b.businessDetails?.pan || '',
            address: b.businessDetails?.address || '',
          },
          bankDetails: {
            accountNumber: b.bankDetails?.accountNumber || '',
            ifsc: b.bankDetails?.ifsc || '',
            bankName: b.bankDetails?.bankName || '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching brand profile:', err);
      setErrorMsg('Unable to retrieve brand partner profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const res = await brandSellerService.updateProfile(form);
      if (res.success) {
        setSuccessMsg('Brand profile and verification details updated successfully.');
        setBrand(res.brand);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error updating brand profile:', err);
      setErrorMsg(err.response?.data?.message || 'Error updating brand profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse text-left py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left pb-20">
      
      {/* Header */}
      <div className="border-b border-brand-gray-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Authorized Brand Profile</h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Manage your public storefront branding, official contact channels, and GST/banking compliance.
          </p>
        </div>

        {brand && (
          <div className="flex items-center space-x-2">
            <Badge variant="success" className="text-xs font-bold uppercase tracking-wider py-1 px-3">
              Status: {brand.status || 'Approved'}
            </Badge>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-brand-gray-200 p-6 md:p-8 rounded-sm shadow-premium space-y-8">
        
        {/* Section 1: Brand Identity & Public Presentation */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5">
            1. Brand Identity & Storefront Appearance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Brand Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-black text-brand-gray-900 focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Official Website</label>
              <input
                type="url"
                placeholder="https://brand.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Public Brand Biography *</label>
              <textarea
                rows={3}
                required
                placeholder="Brand history, engineering ethos, and consumer device specializations..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Logo Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono focus:border-brand-accent focus:ring-0"
              />
              {form.logo && (
                <div className="mt-2 w-12 h-12 rounded border bg-brand-light p-1 overflow-hidden">
                  <img src={form.logo} alt="" className="object-cover h-full w-full" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Storefront Banner URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.banner}
                onChange={(e) => setForm({ ...form, banner: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono focus:border-brand-accent focus:ring-0"
              />
              {form.banner && (
                <div className="mt-2 h-12 w-full rounded border bg-brand-light overflow-hidden">
                  <img src={form.banner} alt="" className="object-cover h-full w-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Official Communications */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5">
            2. Official Business Communication Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Business Email *</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Contact Phone *</label>
              <input
                type="tel"
                required
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Fulfillment Depot / Physical Address</label>
              <input
                type="text"
                placeholder="Technology Logistics Park, Electronic City, Bengaluru, KA, 560100"
                value={form.businessDetails.address}
                onChange={(e) => setForm({ ...form, businessDetails: { ...form.businessDetails, address: e.target.value } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tax & Bank Credentials (Compliance) */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5">
            3. Tax Compliance & Settlement Banking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">GSTIN Number</label>
              <input
                type="text"
                value={form.businessDetails.gstin}
                onChange={(e) => setForm({ ...form, businessDetails: { ...form.businessDetails, gstin: e.target.value.toUpperCase() } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono font-bold uppercase focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">PAN Identifier</label>
              <input
                type="text"
                value={form.businessDetails.pan}
                onChange={(e) => setForm({ ...form, businessDetails: { ...form.businessDetails, pan: e.target.value.toUpperCase() } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono font-bold uppercase focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={form.bankDetails.bankName}
                onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-semibold focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Account Number</label>
              <input
                type="text"
                value={form.bankDetails.accountNumber}
                onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono font-semibold focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">IFSC Code</label>
              <input
                type="text"
                value={form.bankDetails.ifsc}
                onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, ifsc: e.target.value.toUpperCase() } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono font-bold uppercase focus:border-brand-accent focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Read-Only Platform Governance Notice */}
        <div className="p-4 bg-brand-light border border-brand-gray-200 rounded-sm text-xs text-brand-gray-600 space-y-1">
          <p className="font-bold text-brand-gray-800">Platform Governance & Commission Terms:</p>
          <p className="text-[11px] leading-relaxed">
            KAIA applies a standard 5.0% commission on electronic hardware transactions. Changes to commission terms or seller approval status are regulated by central platform administration.
          </p>
        </div>

        <div className="pt-3 border-t border-brand-gray-200 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            className="text-xs uppercase font-bold tracking-wider flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </Button>
        </div>

      </form>

    </div>
  );
};

export default BrandProfile;
