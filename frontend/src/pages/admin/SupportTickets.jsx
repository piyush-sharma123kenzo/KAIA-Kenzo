import React, { useState, useEffect } from 'react';
import { 
  Headphones, Search, Filter, MessageSquare, Send, 
  Clock, CheckCircle2, AlertCircle, RefreshCw, X, 
  User, Mail, ArrowRight, CornerDownRight 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';

const SupportTickets = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected ticket for replying / updating
  const [activeTicket, setActiveTicket] = useState(null);
  const [editStatus, setEditStatus] = useState('Open');
  const [editPriority, setEditPriority] = useState('Medium');
  const [replyMessage, setReplyMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/support/admin', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          page,
          limit: 15,
        },
      });

      if (res.data?.success) {
        setTickets(res.data.tickets || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('[Admin Tickets Fetch Error]:', err);
      toast?.error?.('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleOpenDetail = (tkt) => {
    setActiveTicket(tkt);
    setEditStatus(tkt.status);
    setEditPriority(tkt.priority || 'Medium');
    setReplyMessage('');
  };

  const handleStatusUpdate = async () => {
    if (!activeTicket) return;
    setUpdating(true);

    try {
      const res = await axiosInstance.put(`/support/admin/${activeTicket._id}/status`, {
        status: editStatus,
        priority: editPriority,
      });

      if (res.data?.success) {
        toast?.success?.('Ticket status updated.');
        setActiveTicket(res.data.ticket);
        setTickets(prev => prev.map(t => t._id === activeTicket._id ? res.data.ticket : t));
      }
    } catch (err) {
      console.error('[Update Ticket Error]:', err);
      toast?.error?.('Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setReplying(true);
    try {
      const res = await axiosInstance.post(`/support/admin/${activeTicket._id}/reply`, {
        message: replyMessage.trim(),
      });

      if (res.data?.success) {
        toast?.success?.('Staff reply posted successfully.');
        setActiveTicket(res.data.ticket);
        setTickets(prev => prev.map(t => t._id === activeTicket._id ? res.data.ticket : t));
        setReplyMessage('');
      }
    } catch (err) {
      console.error('[Reply Ticket Error]:', err);
      toast?.error?.('Failed to post reply.');
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Open: 'bg-blue-50 text-blue-700 border-blue-200',
      'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
      'Waiting for Customer': 'bg-purple-50 text-purple-700 border-purple-200',
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
            Customer Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage inquiries, order escalations, warranty claims, and customer replies ({totalCount} total)
          </p>
        </div>

        <button
          onClick={fetchTickets}
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
              placeholder="Search ticket ID, customer, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
          <button type="submit" className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="General">General</option>
            <option value="Orders">Orders</option>
            <option value="Payments">Payments</option>
            <option value="Delivery">Delivery</option>
            <option value="Returns">Returns</option>
            <option value="Warranty">Warranty</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Customer">Waiting for Customer</option>
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
            <p className="text-xs font-bold text-slate-500">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Support Tickets</h3>
            <p className="text-xs text-slate-400">There are no customer support tickets matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject & Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {tickets.map((tkt) => (
                  <tr key={tkt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-amber-600">
                      {tkt.ticketId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tkt.name}</div>
                      <div className="text-[11px] text-slate-500">{tkt.email}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-bold text-slate-900 truncate" title={tkt.subject}>{tkt.subject}</div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{tkt.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tkt.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                        tkt.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tkt.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(tkt.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(tkt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(tkt)}
                        className="bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        Respond
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

      {/* Ticket Response Drawer / Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-600 font-bold uppercase">{activeTicket.category}</span>
                <h3 className="text-base font-black text-slate-900">{activeTicket.subject}</h3>
                <span className="text-[11px] text-slate-400 font-mono">Ticket ID: {activeTicket.ticketId}</span>
              </div>
              <button onClick={() => setActiveTicket(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Customer & Order Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <p className="font-bold text-slate-800">{activeTicket.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                <p className="font-bold text-slate-800">{activeTicket.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Related Order / SN</span>
                <p className="font-bold text-slate-800 font-mono">{activeTicket.orderId || 'N/A'}</p>
              </div>
            </div>

            {/* Original Customer Message */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Inquiry</span>
              <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-700 leading-relaxed border border-slate-200/60">
                {activeTicket.message}
              </div>
            </div>

            {/* Conversation Replies */}
            {activeTicket.replies && activeTicket.replies.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Desk Replies ({activeTicket.replies.length})</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeTicket.replies.map((reply, i) => (
                    <div key={i} className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                        <span>{reply.author} ({reply.authorRole})</span>
                        <span className="text-amber-700/80 font-mono">
                          {new Date(reply.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-slate-700 font-bold block">Send Staff Reply</label>
              <textarea
                rows={3}
                required
                placeholder="Type response to customer ticket..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-amber-500 text-xs font-semibold"
              />
              <button
                type="submit"
                disabled={replying || !replyMessage.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replying ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </form>

            {/* Status & Priority Management */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Update Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Customer">Waiting for Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Update Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
              >
                Close Window
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleStatusUpdate}
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>{updating ? 'Saving...' : 'Update Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupportTickets;
