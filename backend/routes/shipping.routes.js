import express from 'express';
import {
  getShippingRates,
  handleShippingWebhook,
  getShipmentTrackingDetails,
  checkPincodeServiceability,
} from '../controllers/shippingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public / Rates, Serviceability & Webhook
router.post('/rates', getShippingRates);
router.post('/check-pincode', checkPincodeServiceability);
router.post('/webhook', handleShippingWebhook);

// Authenticated Tracking by ID
router.get('/:shipmentId/tracking', protect, getShipmentTrackingDetails);

export default router;
