import React, { useState, useContext, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const SettingsPage = () => {
  const { brand, reloadSession } = useContext(AuthContext);

  const [form, setForm] = useState({
    description: brand?.description || '',
    contactEmail: brand?.contactEmail || '',
    contactPhone: brand?.contactPhone || '',
    logo: brand?.logo || '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await axiosInstance.put('/brands/my-brand', form);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        await reloadSession(); // Refresh profile
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating brand details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Brand Hub Settings</h2>
        <p className="text-xs text-brand-gray-500">Configure your seller logo, profile description, and contact info.</p>
      </div>

      {errorMsg && <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded border border-red-200">{errorMsg}</p>}
      {successMsg && <p className="text-xs text-green-600 font-semibold bg-green-50 p-3 rounded border border-green-200 flex items-center"><CheckCircle className="w-4 h-4 mr-2" />{successMsg}</p>}

      <form onSubmit={handleSubmit} className="bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium space-y-6 text-xs">
        
        <div className="space-y-1.5">
          <label className="font-semibold text-brand-gray-650">Brand Partner Name (Cannot change):</label>
          <input
            type="text"
            disabled
            value={brand?.name || ''}
            className="w-full bg-brand-gray-50 border p-2.5 rounded text-brand-gray-500 cursor-not-allowed font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-brand-gray-655">Brand Logo URL Link:</label>
          <input
            type="text"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
            className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-brand-gray-655">Partner Support Email:</label>
          <input
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full bg-brand-light border border-brand-gray-255 p-2.5 rounded text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-brand-gray-655">Partner Support Phone:</label>
          <input
            type="tel"
            required
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="w-full bg-brand-light border border-brand-gray-255 p-2.5 rounded text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-brand-gray-655">Public Brand Description:</label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-brand-light border border-brand-gray-255 p-2.5 rounded text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-dark hover:bg-brand-gray-850 text-white font-semibold py-3 rounded text-xs transition-colors"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>

      </form>
    </div>
  );
};

export default SettingsPage;
