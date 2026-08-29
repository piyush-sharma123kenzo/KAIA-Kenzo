import express from 'express';
import {
  getUsers,
  toggleUserStatus,
  getAllBrands,
  verifyBrand,
  getPendingProducts,
  verifyProduct,
  createCategory,
  getCommissionsLedger,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('ADMIN')); // Require Admin authorization for all routes here

router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

router.get('/brands', getAllBrands);
router.put('/brands/:id/approve', verifyBrand);

router.get('/products/pending', getPendingProducts);
router.put('/products/:id/verify', verifyProduct);

router.post('/categories', createCategory);
router.get('/commissions', getCommissionsLedger);
router.get('/audit-logs', getAuditLogs);

export default router;
