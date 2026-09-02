import React, { useState, useContext, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Bell, KeyRound, Lock, AlertCircle, Save } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import brandSellerService from '../../services/brandSellerService';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const { user, brand, reloadSession } = useContext(AuthContext);

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    lowStockAlerts: true,
    weeklyDigest: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [prefSuccess, setPrefSuccess] = useState(false);

  const handleTogglePref = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 2500);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (passwordForm.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPass(true);
    try {
      const res = await axiosInstance.post('/account/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.success) {
        setPassMsg({ type: 'success', text: 'Password updated successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Error updating password. Check current password.' });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left pb-20">
      
      {/* Header */}
      <div className="border-b border-brand-gray-200 pb-5">
        <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Seller Account & Security Settings</h2>
        <p className="text-xs text-brand-gray-500 mt-0.5">
          Configure security credentials, notification channels, and operational preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
        <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5">
          Seller Account Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Brand Name</span>
            <p className="font-black text-brand-gray-900 mt-0.5">{brand?.name || 'Authorized Brand'}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Registered Operator</span>
            <p className="font-bold text-brand-gray-900 mt-0.5">{user?.name} ({user?.email})</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Role</span>
            <p className="font-bold text-brand-accent mt-0.5">BRAND SELLER PARTNER</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-gray-400 uppercase block">Partner Status</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {brand?.status || 'Approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
        <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-brand-accent" />
            <span>Fulfillment Alerts & Digest</span>
          </h3>
          {prefSuccess && (
            <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
            </span>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded bg-brand-light cursor-pointer hover:bg-brand-gray-100 transition-colors">
            <div>
              <p className="font-bold text-brand-gray-900">Immediate Customer Order Notifications</p>
              <p className="text-[10px] text-brand-gray-500">Receive email alerts as soon as a customer purchases your brand items.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.orderAlerts}
              onChange={() => handleTogglePref('orderAlerts')}
              className="w-4 h-4 text-brand-accent rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded bg-brand-light cursor-pointer hover:bg-brand-gray-100 transition-colors">
            <div>
              <p className="font-bold text-brand-gray-900">Low Stock Reorder Triggers</p>
              <p className="text-[10px] text-brand-gray-500">Get automated notifications when inventory dips below minimum threshold.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.lowStockAlerts}
              onChange={() => handleTogglePref('lowStockAlerts')}
              className="w-4 h-4 text-brand-accent rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded bg-brand-light cursor-pointer hover:bg-brand-gray-100 transition-colors">
            <div>
              <p className="font-bold text-brand-gray-900">Weekly Performance & Revenue Digest</p>
              <p className="text-[10px] text-brand-gray-500">Receive periodic sales analytics, top moving SKUs, and payout summary reports.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyDigest}
              onChange={() => handleTogglePref('weeklyDigest')}
              className="w-4 h-4 text-brand-accent rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4">
        <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider flex items-center space-x-2 border-b border-brand-gray-200 pb-2.5">
          <KeyRound className="w-4 h-4 text-brand-accent" />
          <span>Update Security Password</span>
        </h3>

        {passMsg.text && (
          <div
            className={`p-3 text-xs font-bold rounded flex items-center space-x-2 ${
              passMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
          >
            {passMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{passMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-gray-700 uppercase">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-gray-700 uppercase">New Password</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-gray-700 uppercase">Confirm Password</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={savingPass}
            className="text-xs uppercase font-bold tracking-wider"
          >
            {savingPass ? 'Updating...' : 'Change Password'}
          </Button>
        </div>
      </form>

    </div>
  );
};

export default SettingsPage;
