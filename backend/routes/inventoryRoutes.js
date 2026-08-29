import express from 'express';
import { getMyInventory, getMySerials, addSerialNumber } from '../controllers/inventoryController.js';
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, checkBrandApproval); // Require Brand approval

router.get('/', getMyInventory);
router.get('/serials', getMySerials);
router.post('/serials', addSerialNumber);

export default router;
