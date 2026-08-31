import express from 'express';
import {
  getBrandDashboard,
  getBrandProducts,
  getBrandProductById,
  createBrandProduct,
  updateBrandProduct,
  deleteBrandProduct,
  getBrandInventory,
  updateBrandStock,
  addBrandProductSerials,
  getBrandOrders,
  getBrandOrderById,
  updateBrandOrderStatus,
  getBrandSales,
  getBrandProfile,
  updateBrandProfile,
} from '../controllers/brandSellerController.js';
import {
  getBrandShipments,
  createBrandShipment,
  getBrandShipmentById,
  generateBrandLabel,
  scheduleBrandPickup,
  updateBrandShipmentStatus,
} from '../controllers/shippingController.js';
import {
  getBrandInventory as getRealBrandInventory,
  stockInInventory,
  adjustBrandStock,
  transferBrandStock,
  getBrandWarehouses,
  createBrandWarehouse,
  updateBrandWarehouse,
  getBrandSerials,
  createBrandSerial,
  importBrandSerials,
  getBrandFulfillmentQueue,
  assignOrderSerial,
  packSellerOrder,
} from '../controllers/inventoryController.js';
import {
  getBrandInvoices,
  getInvoiceById,
  downloadInvoicePdf,
} from '../controllers/invoiceController.js';
import {
  getBrandReturns,
  approveReturn,
  rejectReturn,
  markReturnReceived,
  inspectReturn,
  getReturnDetails,
} from '../controllers/returnController.js';
import {
  getBrandEarnings,
  getBrandLedger,
  getBrandSettlements,
  getSettlementById,
} from '../controllers/settlementController.js';
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

// Apply auth + brand approval checks to all seller endpoints
router.use(protect, checkBrandApproval);

// 1. Dashboard Overview
router.get('/dashboard', getBrandDashboard);

// 2. Shipments & Logistics
router.get('/shipments', getBrandShipments);
router.post('/shipments', createBrandShipment);
router.get('/shipments/:id', getBrandShipmentById);
router.post('/shipments/:id/label', generateBrandLabel);
router.post('/shipments/:id/pickup', scheduleBrandPickup);
router.patch('/shipments/:id/status', updateBrandShipmentStatus);

// 3. Product Management (CRUD)
router.get('/products', getBrandProducts);
router.post('/products', createBrandProduct);
router.get('/products/:id', getBrandProductById);
router.patch('/products/:id', updateBrandProduct);
router.put('/products/:id', updateBrandProduct);
router.delete('/products/:id', deleteBrandProduct);

// 4. Real Database Inventory & Warehouse Depots
router.get('/inventory', getRealBrandInventory);
router.post('/inventory/stock-in', stockInInventory);
router.post('/inventory/adjust', adjustBrandStock);
router.post('/inventory/transfer', transferBrandStock);
router.patch('/inventory/:productId', updateBrandStock);
router.post('/inventory/:productId/serials', addBrandProductSerials);

// 5. Warehouses
router.get('/warehouses', getBrandWarehouses);
router.post('/warehouses', createBrandWarehouse);
router.patch('/warehouses/:id', updateBrandWarehouse);

// 6. Serials & IMEIs
router.get('/serials', getBrandSerials);
router.post('/serials', createBrandSerial);
router.post('/serials/import', importBrandSerials);

// 7. Fulfillment Queue & Packing Station
router.get('/fulfillment', getBrandFulfillmentQueue);
router.post('/orders/:id/assign-serial', assignOrderSerial);
router.post('/orders/:id/pack', packSellerOrder);

// 4. Order Management & Fulfillment Flow
router.get('/orders', getBrandOrders);
router.get('/orders/:id', getBrandOrderById);
router.patch('/orders/:id/status', updateBrandOrderStatus);

// 5. Sales Analytics & Settlement Ledger
router.get('/sales', getBrandSales);
router.get('/earnings', getBrandEarnings);
router.get('/ledger', getBrandLedger);
router.get('/settlements', getBrandSettlements);
router.get('/settlements/:id', getSettlementById);

// 8. Invoices & GST Documents
router.get('/invoices', getBrandInvoices);
router.get('/invoices/:invoiceId', getInvoiceById);
router.get('/invoices/:invoiceId/download', downloadInvoicePdf);

// 9. Returns, Replacements & Reverse Logistics
router.get('/returns', getBrandReturns);
router.get('/returns/:id', getReturnDetails);
router.post('/returns/:id/approve', approveReturn);
router.post('/returns/:id/reject', rejectReturn);
router.post('/returns/:id/received', markReturnReceived);
router.post('/returns/:id/inspect', inspectReturn);

// 6. Brand Profile
router.get('/profile', getBrandProfile);
router.patch('/profile', updateBrandProfile);
router.put('/profile', updateBrandProfile);

export default router;
