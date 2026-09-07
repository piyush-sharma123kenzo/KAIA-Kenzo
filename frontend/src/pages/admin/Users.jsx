import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as UsersIcon, ShieldCheck, ShieldAlert, User, Smartphone, 
  Mail, Search, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Eye, UserCheck, UserX, Trash2, Shield, ShoppingBag, IndianRupee,
  CheckCircle2, XCircle, AlertTriangle, Calendar, Clock, MapPin, X
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const Users = () => {
  const toast = useToast();

  // Directory State
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalBrands: 0,
    totalAdmins: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState(null);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetRoleUser, setTargetRoleUser] = useState(null);
  const [newRole, setNewRole] = useState('CUSTOMER');
  const [submittingRole, setSubmittingRole] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteUser, setTargetDeleteUser] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        emailVerified: emailVerifiedFilter,
        sort: sortBy,
      });

      if (res.success) {
        setUsers(res.users || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('[Admin Users] Error fetching users:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, statusFilter, emailVerifiedFilter, sortBy, toast]);

  // Fetch Stats independently
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await adminService.getUserStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('[Admin Users] Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // View User Details
  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setUserDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await adminService.getUserById(user._id || user.id);
      if (res.success) {
        setUserDetailsData(res);
      }
    } catch (err) {
      console.error('[Admin Users] Error loading user details:', err);
      toast?.error?.('Failed to load full user details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle Status (Active / Suspended)
  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.isActive !== false && user.status !== 'Suspended';
    const nextStatus = isCurrentlyActive ? 'Suspended' : 'Active';

    try {
      const res = await adminService.toggleUserStatus(user._id || user.id, nextStatus);
      if (res.success) {
        toast?.success?.(res.message || `User account is now ${nextStatus.toLowerCase()}.`);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('[Admin Users] Error toggling status:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to change user status.');
    }
  };

  // Open Role Change Modal
  const handleOpenRoleModal = (user) => {
    setTargetRoleUser(user);
    setNewRole(user.role || 'CUSTOMER');
    setRoleModalOpen(true);
  };

  // Submit Role Change
  const handleSubmitRoleChange = async () => {
    if (!targetRoleUser) return;
    setSubmittingRole(true);
    try {
      const res = await adminService.updateUserRole(targetRoleUser._id || targetRoleUser.id, newRole);
      if (res.success) {
        toast?.success?.(res.message || `User role updated to ${newRole}.`);
        setRoleModalOpen(false);
        setTargetRoleUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('[Admin Users] Role update error:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setSubmittingRole(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (user) => {
    setTargetDeleteUser(user);
    setDeleteModalOpen(true);
  };

  // Submit Soft Delete
  const handleSubmitDelete = async () => {
    if (!targetDeleteUser) return;
    setSubmittingDelete(true);
    try {
      const res = await adminService.deleteUser(targetDeleteUser._id || targetDeleteUser.id);
      if (res.success) {
        toast?.success?.(res.message || 'User account deactivated.');
        setDeleteModalOpen(false);
        setTargetDeleteUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('[Admin Users] Delete user error:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to deactivate account.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight flex items-center gap-2.5">
            <UsersIcon className="w-6 h-6 text-brand-accent" />
            User Management Directory
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            Enterprise administration console: Manage customer profiles, brand operators, permissions, and security status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => { fetchUsers(); fetchStats(); }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real MongoDB Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-brand-gray-400">Total Users</p>
          <p className="text-xl font-extrabold text-brand-gray-900 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.totalUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-blue-600">Customers</p>
          <p className="text-xl font-extrabold text-brand-gray-900 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.totalCustomers || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-indigo-600">Brands / Sellers</p>
          <p className="text-xl font-extrabold text-brand-gray-900 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.totalBrands || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-purple-600">Admins</p>
          <p className="text-xl font-extrabold text-brand-gray-900 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.totalAdmins || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-emerald-600">Active</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.activeUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-red-500">Suspended</p>
          <p className="text-xl font-extrabold text-red-600 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.inactiveUsers || 0}
          </p>
        </div>
        <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium">
          <p className="text-[11px] font-bold uppercase text-amber-600">New This Month</p>
          <p className="text-xl font-extrabold text-brand-gray-900 mt-1">
            {loadingStats ? <Skeleton className="h-6 w-12" /> : stats.newUsersThisMonth || 0}
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent transition-colors"
            />
            <Search className="w-4 h-4 text-brand-gray-400 absolute left-2.5 top-2.5" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-brand-gray-400 hover:text-brand-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="md:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent bg-white"
            >
              <option value="all">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="BRAND">Brands / Sellers</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended / Deactivated</option>
            </select>
          </div>

          {/* Email Verification Filter */}
          <div className="md:col-span-2">
            <select
              value={emailVerifiedFilter}
              onChange={(e) => { setEmailVerifiedFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent bg-white"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified Email</option>
              <option value="unverified">Unverified Email</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="last_login">Recent Login</option>
            </select>
          </div>

        </div>
      </div>

      {/* Users Data Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-12 text-center rounded-sm shadow-premium space-y-3">
          <UsersIcon className="w-10 h-10 text-brand-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-brand-gray-700 uppercase">No users found</h3>
          <p className="text-xs text-brand-gray-400">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-gray-50 border-b border-brand-gray-200 text-brand-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User Profile</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Email Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100 font-medium">
                {users.map((u) => {
                  const isUserActive = u.isActive !== false && u.status !== 'Suspended';
                  const profileUrl = u.profileImage?.url || u.avatar || '';

                  return (
                    <tr key={u._id || u.id} className="hover:bg-brand-light/30 transition-colors">
                      {/* User Profile */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          {profileUrl ? (
                            <img
                              src={profileUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-brand-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-gray-100 text-brand-gray-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-brand-gray-900 truncate">{u.name || 'Anonymous User'}</p>
                            <p className="text-[10px] text-brand-gray-400 font-mono truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5 font-mono text-brand-gray-600">
                        {u.phone || <span className="text-brand-gray-300 italic">None</span>}
                      </td>

                      {/* Role Badge */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'BRAND'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-brand-gray-100 text-brand-gray-700 border border-brand-gray-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isUserActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                        }`}>
                          {isUserActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Email Verification */}
                      <td className="p-3.5">
                        {u.emailVerified || u.isEmailVerified ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-bold text-amber-600 gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="p-3.5 font-mono text-brand-gray-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>

                      {/* Last Login */}
                      <td className="p-3.5 font-mono text-brand-gray-500 text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : <span className="text-brand-gray-300 italic">Never</span>}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(u)}
                            title="View Account Details"
                            className="p-1.5 text-brand-gray-500 hover:text-brand-accent hover:bg-brand-gray-50 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Role Change */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            title="Change Role"
                            className="p-1.5 text-brand-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active/Suspend */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={isUserActive ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded transition-colors ${
                              isUserActive
                                ? 'text-brand-gray-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-brand-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {isUserActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Soft Delete */}
                          <button
                            onClick={() => handleOpenDeleteModal(u)}
                            title="Deactivate / Delete User"
                            className="p-1.5 text-brand-gray-400 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 border-t border-brand-gray-200 bg-brand-gray-50/50 gap-3 text-xs">
            <div className="flex items-center space-x-2 text-brand-gray-500">
              <span>Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} users</span>
              <span>•</span>
              <span>Page size:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 border border-brand-gray-200 rounded text-xs bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 border border-brand-gray-200 rounded bg-white text-brand-gray-700 disabled:opacity-40 hover:bg-brand-gray-50 flex items-center gap-1 font-bold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-3 py-1 font-bold text-brand-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 border border-brand-gray-200 rounded bg-white text-brand-gray-700 disabled:opacity-40 hover:bg-brand-gray-50 flex items-center gap-1 font-bold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. USER DETAILS MODAL */}
      {/* ========================================================================= */}
      {userDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-gray-200 rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-brand-gray-200 flex justify-between items-center bg-brand-gray-50">
              <div>
                <h3 className="text-base font-extrabold text-brand-gray-900 uppercase">
                  User Account Intelligence
                </h3>
                <p className="text-xs text-brand-gray-500">Comprehensive profile & transaction history</p>
              </div>
              <button
                onClick={() => { setUserDetailsModalOpen(false); setUserDetailsData(null); }}
                className="text-brand-gray-400 hover:text-brand-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : userDetailsData ? (
                <>
                  {/* Header Profile Section */}
                  <div className="flex items-center space-x-4 p-4 bg-brand-light/30 rounded border border-brand-gray-100">
                    {userDetailsData.user?.profileImage?.url ? (
                      <img
                        src={userDetailsData.user.profileImage.url}
                        alt="Profile"
                        className="w-14 h-14 rounded-full object-cover border border-brand-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-brand-gray-200 text-brand-gray-700 font-extrabold flex items-center justify-center text-lg flex-shrink-0">
                        {(userDetailsData.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-bold text-brand-gray-900">{userDetailsData.user?.name}</h4>
                      <p className="text-xs text-brand-gray-500 font-mono">{userDetailsData.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          {userDetailsData.user?.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          userDetailsData.user?.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {userDetailsData.user?.isActive !== false ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Statistics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-brand-gray-50 border border-brand-gray-200 rounded text-center">
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Lifetime Orders</p>
                      <p className="text-lg font-black text-brand-gray-900 mt-1">{userDetailsData.stats?.totalOrders || 0}</p>
                    </div>
                    <div className="p-3 bg-brand-gray-50 border border-brand-gray-200 rounded text-center">
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Total Spend</p>
                      <p className="text-lg font-black text-emerald-600 mt-1">₹{(userDetailsData.stats?.totalSpent || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 bg-brand-gray-50 border border-brand-gray-200 rounded text-center">
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Returns Filed</p>
                      <p className="text-lg font-black text-brand-gray-900 mt-1">{userDetailsData.stats?.returnsCount || 0}</p>
                    </div>
                  </div>

                  {/* Account Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Contact Phone</p>
                      <p className="font-mono text-brand-gray-800 mt-0.5">{userDetailsData.user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Email Verified</p>
                      <p className="font-bold mt-0.5">
                        {userDetailsData.user?.isEmailVerified ? (
                          <span className="text-emerald-600">Yes (Verified)</span>
                        ) : (
                          <span className="text-amber-600">No (Pending)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Account Created</p>
                      <p className="font-mono text-brand-gray-800 mt-0.5">
                        {userDetailsData.user?.createdAt ? new Date(userDetailsData.user.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-gray-400 uppercase">Last Login Activity</p>
                      <p className="font-mono text-brand-gray-800 mt-0.5">
                        {userDetailsData.user?.lastLogin ? new Date(userDetailsData.user.lastLogin).toLocaleString('en-IN') : 'No recorded login'}
                      </p>
                    </div>
                  </div>

                  {/* Saved Delivery Addresses */}
                  {userDetailsData.rawUser?.addresses?.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <h5 className="text-xs font-bold uppercase text-brand-gray-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-accent" /> Saved Addresses ({userDetailsData.rawUser.addresses.length})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {userDetailsData.rawUser.addresses.map((addr, idx) => (
                          <div key={idx} className="p-2.5 bg-brand-gray-50 border border-brand-gray-200 rounded text-[11px] space-y-0.5">
                            <p className="font-bold text-brand-gray-900">{addr.fullName || addr.name} ({addr.type || 'Home'})</p>
                            <p className="text-brand-gray-600">{addr.addressLine1} {addr.addressLine2}</p>
                            <p className="text-brand-gray-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                            <p className="text-brand-gray-500 font-mono">Ph: {addr.phone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Associated Brand Partner Info if applicable */}
                  {userDetailsData.brand && (
                    <div className="p-3 bg-blue-50/50 border border-blue-200 rounded space-y-1 text-xs">
                      <p className="font-bold text-blue-900 uppercase text-[10px]">Associated Brand Partner Entity</p>
                      <p className="font-extrabold text-brand-gray-900">{userDetailsData.brand.name}</p>
                      <p className="text-brand-gray-600 text-[11px]">Brand Status: <span className="font-bold">{userDetailsData.brand.status}</span></p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-brand-gray-200 bg-brand-gray-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setUserDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ROLE MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {roleModalOpen && targetRoleUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-gray-200 rounded-sm shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-extrabold text-brand-gray-900 uppercase">Change Account Role</h3>
                <p className="text-xs text-brand-gray-500 mt-0.5">Target: <span className="font-bold text-brand-gray-900">{targetRoleUser.name}</span> ({targetRoleUser.email})</p>
              </div>
              <button onClick={() => setRoleModalOpen(false)} className="text-brand-gray-400 hover:text-brand-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-brand-gray-700">Select Access Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-brand-gray-200 rounded-sm text-xs focus:outline-none focus:border-brand-accent bg-white font-bold"
              >
                <option value="CUSTOMER">CUSTOMER — Standard E-commerce Buyer</option>
                <option value="BRAND">BRAND — Direct Supply Partner / Seller</option>
                <option value="ADMIN">ADMIN — System Administrator</option>
              </select>

              {newRole === 'ADMIN' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                  <span>Granting the <strong>ADMIN</strong> role gives full operational access to orders, finances, settings, and user accounts.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitRoleChange} disabled={submittingRole}>
                {submittingRole ? 'Updating...' : 'Confirm Role Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SOFT DELETE / DEACTIVATE MODAL */}
      {/* ========================================================================= */}
      {deleteModalOpen && targetDeleteUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-gray-200 rounded-sm shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-extrabold uppercase">Deactivate User Account</h3>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="text-brand-gray-400 hover:text-brand-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-brand-gray-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-brand-gray-900">{targetDeleteUser.name}</strong> (<span className="font-mono">{targetDeleteUser.email}</span>)?
              <br /><br />
              This is a <strong>safe soft-delete</strong>. The user will be blocked from signing in or accessing the store, but all order records, invoices, and financial transaction history will remain intact.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <button
                onClick={handleSubmitDelete}
                disabled={submittingDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-sm disabled:opacity-50"
              >
                {submittingDelete ? 'Deactivating...' : 'Yes, Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
