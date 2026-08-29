import express from 'express';
import { verifyPayment, paymentWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/verify', protect, verifyPayment);
router.post('/webhook', paymentWebhook); // Webhooks are generally unauthenticated with header signature checks

export default router;
