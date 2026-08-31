import express from 'express';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAddresses)
  .post(addAddress);

router.route('/:id')
  .put(updateAddress)
  .patch(updateAddress)
  .delete(deleteAddress);

router.route('/:id/default')
  .post(setDefaultAddress)
  .patch(setDefaultAddress);

export default router;
