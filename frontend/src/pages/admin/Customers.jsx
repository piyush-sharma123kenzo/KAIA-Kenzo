import React, { useState, useEffect } from 'react';
import { 
  Users, Search, CheckCircle2, XCircle, ShieldAlert, 
  ShoppingBag, IndianRupee, RefreshCw 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Customers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axiosInstance.put(`/api/admin/users/${id}/status`, { isActive: !currentStatus });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Registered customer profiles, account verification flags, order activities, and account status controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent"
            />
            <Search className="w-3.5 h-3.5 text-brand-gray-400 absolute left-2.5 top-2.5" />
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-12 text-center rounded-sm shadow-premium space-y-3">
          <Users className="w-10 h-10 text-brand-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-brand-gray-700 uppercase">No customers found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-light border-b border-brand-gray-200 text-brand-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100 font-medium">
                {filteredUsers.map((item) => (
                  <tr key={item._id} className="hover:bg-brand-light/30">
                    <td className="p-3.5">
                      <p className="font-bold text-brand-gray-900">{item.name || 'User'}</p>
                      <span className="text-[10px] text-brand-gray-400 font-mono">{item.email}</span>
                    </td>
                    <td className="p-3.5 font-mono text-brand-gray-600">{item.phone || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        item.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' :
                        item.role === 'BRAND' ? 'bg-blue-50 text-blue-700' : 'bg-brand-gray-100 text-brand-gray-700'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        item.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {item.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-brand-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right">
                      {item.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleStatus(item._id, item.isActive !== false)}
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-colors ${
                            item.isActive !== false
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isActive !== false ? 'Suspend' : 'Activate'}
                        </button>
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

export default Customers;
