import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Filter, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Mail, Phone, Calendar, 
  Edit3, Save, RefreshCw, X 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

const Enquiries = () => {
  const toast = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected enquiry for detail/edit
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [editStatus, setEditStatus] = useState('New');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/enquiries/admin', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          page,
          limit: 15,
        },
      });

      if (res.data?.success) {
        setEnquiries(res.data.enquiries || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('[Admin Enquiries Fetch Error]:', err);
      toast?.error?.('Failed to load direct supply inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEnquiries();
  };

  const handleOpenDetail = (enq) => {
    setActiveEnquiry(enq);
    setEditStatus(enq.status);
    setAdminNotes(enq.adminNotes || '');
  };

  const handleUpdate = async () => {
    if (!activeEnquiry) return;
    setUpdating(true);

    try {
      const res = await axiosInstance.put(`/enquiries/admin/${activeEnquiry._id}`, {
        status: editStatus,
        adminNotes,
      });

      if (res.data?.success) {
        toast?.success?.('Enquiry status updated successfully.');
        setActiveEnquiry(res.data.enquiry);
        setEnquiries(prev => prev.map(e => e._id === activeEnquiry._id ? res.data.enquiry : e));
      }
    } catch (err) {
      console.error('[Update Enquiry Error]:', err);
      toast?.error?.('Failed to update enquiry.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      New: 'bg-blue-50 text-blue-700 border-blue-200',
      'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
      Contacted: 'bg-purple-50 text-purple-700 border-purple-200',
      Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Closed: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Direct Supply Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage bulk B2B procurement requests and institutional quote requirements ({totalCount} total)
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2 px-4 rounded-xl flex items-center space-x-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search company, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <button type="submit" className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Contacted">Contacted</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading B2B inquiries...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Inquiries Found</h3>
            <p className="text-xs text-slate-400">There are no direct supply inquiries matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Company & Contact</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {enquiries.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{enq.companyName}</div>
                      <div className="text-[11px] text-slate-500">{enq.name} · {enq.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{enq.phone}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={enq.productRequirement}>
                      {enq.productRequirement}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      {enq.quantity} Units
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {enq.targetTimeline}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(enq.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(enq)}
                        className="bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & Update Drawer / Modal */}
      {activeEnquiry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{activeEnquiry.companyName}</h3>
                <span className="text-[11px] text-slate-400 font-mono">ID: {activeEnquiry._id}</span>
              </div>
              <button onClick={() => setActiveEnquiry(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact Person</span>
                  <p className="font-bold text-slate-800">{activeEnquiry.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                  <p className="font-bold text-slate-800">{activeEnquiry.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone</span>
                  <p className="font-bold text-slate-800 font-mono">{activeEnquiry.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Volume Target</span>
                  <p className="font-black text-amber-600 font-mono">{activeEnquiry.quantity} Units</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Hardware Requirement</span>
                <p className="font-bold text-slate-900 mt-0.5">{activeEnquiry.productRequirement}</p>
              </div>

              {activeEnquiry.message && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Client Note</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl mt-0.5">{activeEnquiry.message}</p>
                </div>
              )}

              {/* Status Update Control */}
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-700 font-bold block">Update Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-amber-500 font-bold text-xs"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record quote references, assigned sales rep, or meeting details..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveEnquiry(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdate}
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{updating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Enquiries;
