import express from 'express';
import { verifyCoupon, getActiveCoupons } from '../controllers/couponController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getActiveCoupons);
router.post('/verify', protect, verifyCoupon);

export default router;
