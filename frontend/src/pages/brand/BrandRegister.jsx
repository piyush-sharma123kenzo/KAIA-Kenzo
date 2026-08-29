import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldCheck, Landmark, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const BrandRegister = () => {
  const navigate = useNavigate();
  const { user, reloadSession } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    gstin: '',
    pan: '',
    address: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle application submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/brands/register', {
        name: form.name,
        description: form.description,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        businessDetails: {
          gstin: form.gstin.toUpperCase(),
          pan: form.pan.toUpperCase(),
          address: form.address,
        },
        bankDetails: {
          accountNumber: form.accountNumber,
          ifsc: form.ifsc.toUpperCase(),
          bankName: form.bankName,
        },
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        // Reload user session to update role/details
        await reloadSession();
        setTimeout(() => {
          navigate('/brand/dashboard');
        }, 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error submitting brand application.');
    } finally {
      setLoading(false);
    }
  };

  // Safe checks: If user is not logged in, ask them to sign in
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 border border-brand-gray-250 rounded-sm shadow-premium text-center space-y-6 text-left">
          <Building2 className="w-12 h-12 text-brand-accent mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Become a Brand Partner</h2>
            <p className="text-sm text-brand-gray-500 max-w-xs mx-auto">
              Please sign in or create a standard user account before submitting brand verification details.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Link
              to="/login"
              className="block w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm"
            >
              Sign In to Continue
            </Link>
            <Link
              to="/register"
              className="block text-xs font-semibold text-brand-accent hover:underline"
            >
              Create Customer Account First
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-left">
      <div className="space-y-2">
        <span className="inline-block text-[10px] font-bold tracking-wider text-brand-accent uppercase bg-brand-accent/5 border border-brand-accent/20 px-2.5 py-1 rounded">
          Sellers Portal
        </span>
        <h1 className="text-3xl font-extrabold text-brand-gray-900 tracking-tight">Register Your Brand Partner Profile</h1>
        <p className="text-sm text-brand-gray-500">
          Complete compliance paperwork to unlock direct multi-brand listings, logistics, and payout settlements.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-sm flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-brand-gray-250 p-8 rounded-sm shadow-premium space-y-8">
        
        {/* Section 1: Basic details */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-wider border-b pb-2">1. Brand Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Brand / Company Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. ASUS Republic of Gamers"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm font-semibold text-brand-gray-800"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Brand Description:</label>
              <textarea
                rows={3}
                required
                placeholder="Describe your product lineup and hardware expertise..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Partner Contact Email:</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Partner Contact Phone:</label>
              <input
                type="tel"
                required
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Business & Tax details */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-wider border-b pb-2">2. Business Verification Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Business GSTIN (15 Digits):</label>
              <input
                type="text"
                required
                placeholder="e.g. 27AAAAA1111A1Z1"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm uppercase font-semibold tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Company PAN Card:</label>
              <input
                type="text"
                required
                placeholder="e.g. AAAAA1111A"
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm uppercase font-semibold tracking-wider"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Registered Corporate Address:</label>
              <input
                type="text"
                required
                placeholder="Street address, city, state, postal code"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bank Payout details */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-wider border-b pb-2">3. Bank Settlement Payouts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Bank Account Number:</label>
              <input
                type="text"
                required
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Bank IFSC Code:</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC0000060"
                value={form.ifsc}
                onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm uppercase font-semibold tracking-wider"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-semibold text-brand-gray-650">Beneficiary Bank Name:</label>
              <input
                type="text"
                required
                placeholder="HDFC Bank, State Bank of India..."
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded-sm text-sm transition-colors flex items-center justify-center space-x-2"
        >
          <span>{loading ? 'Submitting Registration...' : 'Submit Partnership Registration'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>
    </div>
  );
};

export default BrandRegister;
