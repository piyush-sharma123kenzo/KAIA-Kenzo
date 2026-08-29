import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, User, Smartphone, Mail } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Error fetching users directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    if (!window.confirm(`Are you sure you want to suspend/activate this account? Current status is ${currentStatus}`)) return;

    try {
      const res = await axiosInstance.put(`/admin/users/${id}/status`, { status: nextStatus });
      if (res.data.success) {
        alert(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert('Error modifying account status.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading accounts directory...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">User Accounts Directory</h2>
        <p className="text-xs text-brand-gray-500">Manage buyer profiles, brand operators, and toggle account suspensions.</p>
      </div>

      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
          <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">Account name</th>
              <th className="px-6 py-4">Email Address</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Access Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Fulfillment controls</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y text-brand-gray-700">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-brand-gray-50/50">
                <td className="px-6 py-4 font-bold text-brand-gray-900 flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-brand-gray-100 flex items-center justify-center font-bold text-brand-gray-700">
                    {u.name.charAt(0)}
                  </div>
                  <span>{u.name}</span>
                </td>
                <td className="px-6 py-4 font-semibold">{u.email}</td>
                <td className="px-6 py-4">{u.phone || 'N/A'}</td>
                <td className="px-6 py-4 font-bold tracking-wider text-brand-accent">{u.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    u.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(u._id, u.status)}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase border ${
                      u.status === 'Active'
                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {u.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Users;
