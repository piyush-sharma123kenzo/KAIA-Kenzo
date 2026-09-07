import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await axiosInstance.get('/api/notifications/unread-count');
      if (res.data?.success) {
        setUnreadCount(Number(res.data.unreadCount) || 0);
      }
    } catch (err) {
      // Fail silently to prevent console spam
    }
  }, [user]);

  // 2. Fetch full notifications list (with optional query filter)
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/notifications', { params });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        if (res.data.unreadCount !== undefined) {
          setUnreadCount(Number(res.data.unreadCount) || 0);
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Error fetching notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!id) return;
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] Error marking notification read:', err.message);
    }
  }, []);

  // 4. Mark all user notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.patch('/api/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Error marking all notifications read:', err.message);
    }
  }, []);

  // 5. Delete a notification
  const deleteNotification = useCallback(async (id) => {
    if (!id) return;
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      setNotifications((prev) => {
        const item = prev.find((n) => n._id === id);
        if (item && !item.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error('[NotificationContext] Error deleting notification:', err.message);
    }
  }, []);

  // 6. Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await axiosInstance.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Error clearing notifications:', err.message);
    }
  }, []);

  // Sync on login/logout & periodic poll every 30s
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
