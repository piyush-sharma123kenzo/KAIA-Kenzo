import express from 'express';
import {
  initiateCheckout,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  getSellerOrderDetails,
  fulfillSellerOrder,
  updateFulfillmentStatus,
  downloadInvoice,
} from '../controllers/orderController.js';
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All order routes require login

router.post('/checkout', initiateCheckout);
router.get('/customer/my-orders', getMyOrders);
router.get('/seller/my-orders', checkBrandApproval, getSellerOrders);
router.get('/seller/my-orders/:childOrderId', checkBrandApproval, getSellerOrderDetails);
router.put('/seller/my-orders/:childOrderId/fulfill', checkBrandApproval, fulfillSellerOrder);
router.put('/seller/my-orders/:childOrderId/status', checkBrandApproval, updateFulfillmentStatus);
router.get('/:childOrderId/invoice', downloadInvoice);
router.get('/:orderId', getOrderById);

export default router;
