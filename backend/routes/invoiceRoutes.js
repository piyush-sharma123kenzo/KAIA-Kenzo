import express from 'express';
import {
  getInvoiceById,
  downloadInvoicePdf,
} from '../controllers/invoiceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:invoiceId', getInvoiceById);
router.get('/:invoiceId/download', downloadInvoicePdf);

export default router;
