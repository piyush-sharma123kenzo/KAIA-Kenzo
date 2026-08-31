import express from 'express';
import {
  createCustomerReturn,
  getMyReturns,
  getReturnDetails,
  cancelCustomerReturn,
} from '../controllers/returnController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All return operations require customer auth

router.post('/', createCustomerReturn);
router.get('/my-returns', getMyReturns);
router.get('/:id', getReturnDetails);
router.put('/:id/cancel', cancelCustomerReturn);

export default router;
