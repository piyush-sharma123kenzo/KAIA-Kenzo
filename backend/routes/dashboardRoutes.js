import express from 'express';
import { getBrandDashboardStats, getAdminDashboardStats } from '../controllers/dashboardController.js';
import { protect, authorize, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.get('/seller', protect, checkBrandApproval, getBrandDashboardStats);
router.get('/admin', protect, authorize('ADMIN'), getAdminDashboardStats);

export default router;
