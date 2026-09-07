import express from 'express';
import {
  initiateCheckout,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  getSellerOrderDetails,
  fulfillSellerOrder,
  updateFulfillmentStatus,
  downloadInvoice,
} from '../controllers/orderController.js';
import {
  getCustomerOrderShipments,
  getShipmentTrackingDetails,
} from '../controllers/shippingController.js';
import {
  getOrderInvoices,
} from '../controllers/invoiceController.js';
import {
  updateAdminOrderStatus,
} from '../controllers/adminController.js';
import { protect, authorize, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All order routes require login

// Customer Order Lifecycle, Invoices & Shipments Tracking
router.post('/checkout', initiateCheckout);
router.get('/', getMyOrders);
router.get('/customer/my-orders', getMyOrders);
router.get('/:orderId/invoices', getOrderInvoices);
router.get('/:orderId/shipments', getCustomerOrderShipments);
router.get('/:orderId/tracking', getCustomerOrderShipments);
router.get('/shipments/:shipmentId/tracking', getShipmentTrackingDetails);
router.get('/:orderId', getOrderById);
router.put('/:orderId/cancel', cancelOrder);
router.post('/:orderId/cancel', cancelOrder);
router.get('/:childOrderId/invoice', downloadInvoice);

// Admin Order Status Update
router.patch('/:orderId/status', authorize('ADMIN'), updateAdminOrderStatus);
router.put('/:orderId/status', authorize('ADMIN'), updateAdminOrderStatus);

// Legacy/Direct Seller Order Endpoints
router.get('/seller/my-orders', checkBrandApproval, getSellerOrders);
router.get('/seller/my-orders/:childOrderId', checkBrandApproval, getSellerOrderDetails);
router.put('/seller/my-orders/:childOrderId/fulfill', checkBrandApproval, fulfillSellerOrder);
router.put('/seller/my-orders/:childOrderId/status', checkBrandApproval, updateFulfillmentStatus);

export default router;
