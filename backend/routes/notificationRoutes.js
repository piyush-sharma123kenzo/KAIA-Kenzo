import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification endpoints require authenticated session
router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.post('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

export default router;
