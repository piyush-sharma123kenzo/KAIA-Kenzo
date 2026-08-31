import express from 'express';
import {
  getAdminDashboardSummary,
  getUsers,
  getUserDetailsById,
  toggleUserStatus,
  getAllBrands,
  getBrandDetailsById,
  verifyBrand,
  getPendingProducts,
  verifyProduct,
  createCategory,
  updateCategory,
  getAdminPayments,
  getAdminReviews,
  moderateReview,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  getAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  getAdminWebhooks,
  getSystemHealth,
  exportEntityCsv,
  getCommissionsLedger,
  getAuditLogs,
  getAdminOrders,
  getAdminOrderById,
} from '../controllers/adminController.js';
import {
  getAdminShipments,
  getAdminShipmentById,
} from '../controllers/shippingController.js';
import {
  getAdminInventory,
  getAdminWarehouses,
  getAdminSerials,
  adjustBrandStock,
} from '../controllers/inventoryController.js';
import {
  getAdminInvoices,
  getInvoiceById,
  downloadInvoicePdf,
} from '../controllers/invoiceController.js';
import {
  getAdminReturns,
  approveReturn,
  rejectReturn,
  inspectReturn,
  getReturnDetails,
} from '../controllers/returnController.js';
import {
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
} from '../controllers/commissionController.js';
import {
  getAdminRevenue,
  getAdminSettlements,
  generateSettlements,
  approveSettlement as approveAdminSettlement,
  processSettlement as processAdminSettlement,
  createManualAdjustment,
} from '../controllers/settlementController.js';
import {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../controllers/adminProductController.js';
import { getCategories } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Require Admin authorization for all routes
router.use(protect, authorize('ADMIN'));

// 1. Dashboard & Deep Analytics
router.get('/dashboard', getAdminDashboardSummary);
router.get('/analytics', getAdminDashboardSummary);

// 2. Orders & Fulfillment
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);

// 3. Shipping & Logistics
router.get('/shipments', getAdminShipments);
router.get('/shipments/:id', getAdminShipmentById);

// 4. Warehouse Inventory & Physical Serials
router.get('/inventory', getAdminInventory);
router.post('/inventory/adjust', adjustBrandStock);
router.get('/warehouses', getAdminWarehouses);
router.get('/serials', getAdminSerials);

// 5. GST Tax Invoices
router.get('/invoices', getAdminInvoices);
router.get('/invoices/:invoiceId', getInvoiceById);
router.get('/invoices/:invoiceId/download', downloadInvoicePdf);

// 6. Returns & RMA Claims
router.get('/returns', getAdminReturns);
router.get('/returns/:id', getReturnDetails);
router.post('/returns/:id/approve', approveReturn);
router.post('/returns/:id/reject', rejectReturn);
router.post('/returns/:id/inspect', inspectReturn);

// 7. Finance: Revenue, Commissions, Settlements & Adjustments
router.get('/revenue', getAdminRevenue);
router.get('/commissions', getCommissionRules);
router.post('/commissions', createCommissionRule);
router.patch('/commissions/:id', updateCommissionRule);

router.get('/settlements', getAdminSettlements);
router.post('/settlements/generate', generateSettlements);
router.post('/settlements/:id/approve', approveAdminSettlement);
router.post('/settlements/:id/process', processAdminSettlement);

router.post('/adjustments', createManualAdjustment);

// 8. Payment Ledger & Reconciliation
router.get('/payments', getAdminPayments);

// 9. Accounts & Users Directory
router.get('/users', getUsers);
router.get('/users/:id', getUserDetailsById);
router.put('/users/:id/status', toggleUserStatus);

// 10. Brands & Approvals
router.get('/brands', getAllBrands);
router.get('/brands/:id', getBrandDetailsById);
router.put('/brands/:id/approve', verifyBrand);

// 11. Products & Management (Full Admin Product Management)
router.get('/products', getAdminProducts);
router.get('/products/pending', getPendingProducts);
router.get('/products/:id', getAdminProductById);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.put('/products/:id/verify', verifyProduct);

// 12. Categories Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);

// 13. Customer Reviews Moderation
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:id/moderate', moderateReview);

// 14. Marketing: Coupons & Promotions
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.patch('/coupons/:id', updateAdminCoupon);

router.get('/promotions', getAdminPromotions);
router.post('/promotions', createAdminPromotion);
router.patch('/promotions/:id', updateAdminPromotion);

// 15. System Operations: Webhooks, System Health & Audit
router.get('/webhooks', getAdminWebhooks);
router.get('/system-health', getSystemHealth);
router.get('/audit-logs', getAuditLogs);
router.get('/export/:entity', exportEntityCsv);

export default router;
