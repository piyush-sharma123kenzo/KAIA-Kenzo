import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, Package, 
  RotateCcw, DollarSign, CheckCheck, RefreshCw 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/account/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await axiosInstance.post('/api/account/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/account/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto font-sans select-none pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            Central Command Notifications
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            System alerts for pending brand seller verifications, product approvals, and operational milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            <span>Mark All as Read</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-brand-gray-200 p-4 rounded-sm space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-12 text-center rounded-sm shadow-premium space-y-3">
          <Bell className="w-10 h-10 text-brand-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-brand-gray-700 uppercase">No alerts</h3>
          <p className="text-xs text-brand-gray-400">All marketplace operations are running smoothly.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium divide-y divide-brand-gray-100">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markOneRead(n._id)}
              className={`p-4 flex items-start justify-between gap-4 hover:bg-brand-light/40 transition-colors cursor-pointer ${
                !n.read ? 'bg-amber-50/30' : ''
              }`}
            >
              <div className="flex items-start space-x-3 text-xs">
                <div className={`p-2 rounded-full mt-0.5 ${!n.read ? 'bg-amber-100 text-amber-700' : 'bg-brand-gray-100 text-brand-gray-500'}`}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className={`text-xs ${!n.read ? 'font-black text-brand-gray-900' : 'font-semibold text-brand-gray-700'}`}>
                    {n.title}
                  </h4>
                  <p className="text-xs text-brand-gray-500 leading-relaxed font-normal">{n.message}</p>
                  <span className="text-[10px] text-brand-gray-400 font-mono block pt-1">
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-amz-orange shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notifications;
