import Notification from '../models/Notification.js';

// @desc    Get user notifications with pagination & filtering
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const { filter, type, unreadOnly } = req.query;
    const query = { user: req.user._id };

    if (filter === 'unread' || unreadOnly === 'true') {
      query.read = false;
    } else if (filter === 'read') {
      query.read = true;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('[NotificationController] getMyNotifications error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
};

// @desc    Get real-time unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('[NotificationController] getUnreadCount error:', error.message);
    res.status(500).json({ success: false, message: 'Error counting unread notifications.' });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read or PUT /api/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('[NotificationController] markNotificationRead error:', error.message);
    res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

// @desc    Mark all user notifications as read
// @route   POST /api/notifications/read-all or PATCH /api/notifications/read-all
// @access  Private
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[NotificationController] markAllNotificationsRead error:', error.message);
    res.status(500).json({ success: false, message: 'Error marking all notifications as read.' });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('[NotificationController] deleteNotification error:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting notification.' });
  }
};

// @desc    Clear all notifications for user
// @route   DELETE /api/notifications
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.status(200).json({ success: true, message: 'All notifications cleared successfully.' });
  } catch (error) {
    console.error('[NotificationController] clearAllNotifications error:', error.message);
    res.status(500).json({ success: false, message: 'Error clearing notifications.' });
  }
};
