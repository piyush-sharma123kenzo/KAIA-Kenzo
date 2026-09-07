import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, Package, 
  RotateCcw, DollarSign, CheckCheck, RefreshCw, Trash2,
  ChevronRight
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useNotifications } from '../../context/NotificationContext';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Notifications = () => {
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === 'unread') params.filter = 'unread';
      if (activeFilter === 'read') params.filter = 'read';
      if (['ORDER', 'PRODUCT', 'STOCK', 'BRAND', 'Approval'].includes(activeFilter)) {
        params.type = activeFilter;
      }

      const res = await axiosInstance.get('/notifications', { params });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Error fetching brand notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const markAllRead = async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const deleteOne = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Error deleting brand notification:', err);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'ORDER', label: 'Orders & Dispatch' },
    { id: 'PRODUCT', label: 'Product Status' },
    { id: 'STOCK', label: 'Inventory & Stock' },
  ];

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
              Brand Activity & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-brand-gray-500 mt-1">
            System notifications for incoming orders, packing dispatch alerts, reverse return requests, and catalog approvals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs">
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              <span>Mark All as Read</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition-colors uppercase tracking-wider ${
              activeFilter === tab.id
                ? 'bg-brand-dark text-white shadow-xs'
                : 'bg-white border border-brand-gray-200 text-brand-gray-600 hover:bg-brand-gray-50 hover:text-brand-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-12 text-center rounded-sm shadow-premium space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gray-100 flex items-center justify-center mx-auto text-brand-gray-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-brand-gray-700 uppercase tracking-wider">No notifications</h3>
          <p className="text-xs text-brand-gray-400">You're completely caught up on your brand alerts.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium divide-y divide-brand-gray-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markOneRead(n._id)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                !n.read ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-brand-light/40'
              }`}
            >
              <div className="flex items-start space-x-3.5 text-xs">
                <div className={`p-2.5 rounded-sm mt-0.5 ${!n.read ? 'bg-amber-100 text-amber-800' : 'bg-brand-gray-100 text-brand-gray-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-xs ${!n.read ? 'font-black text-brand-gray-900' : 'font-semibold text-brand-gray-700'}`}>
                      {n.title}
                    </h4>
                    {n.type && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-brand-gray-100 text-brand-gray-600 font-mono font-bold">
                        {n.type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-gray-500 leading-relaxed font-normal">{n.message}</p>
                  <div className="flex items-center space-x-3 text-[10px] text-brand-gray-400 font-mono pt-1">
                    <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-700 hover:text-amber-800 font-bold hover:underline flex items-center space-x-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 pt-1">
                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amz-orange ring-2 ring-amber-200 shrink-0" />
                )}
                <button
                  onClick={(e) => deleteOne(n._id, e)}
                  title="Delete Alert"
                  className="p-1.5 rounded-sm text-brand-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notifications;
