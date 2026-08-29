import express from 'express';
import { getMyNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure

router.get('/', getMyNotifications);
router.put('/:id/read', markNotificationRead);

export default router;
