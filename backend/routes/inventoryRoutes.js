import express from 'express';
import {
  getBrandInventory,
  getBrandSerials,
  createBrandSerial,
  importBrandSerials,
  getBrandFulfillmentQueue,
  assignOrderSerial,
  packSellerOrder,
} from '../controllers/inventoryController.js';
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, checkBrandApproval); // Require Brand approval

router.get('/', getBrandInventory);
router.get('/serials', getBrandSerials);
router.post('/serials', createBrandSerial);
router.post('/serials/import', importBrandSerials);
router.get('/fulfillment', getBrandFulfillmentQueue);
router.post('/fulfillment/:orderId/assign-serial', assignOrderSerial);
router.post('/fulfillment/:orderId/pack', packSellerOrder);

export default router;
