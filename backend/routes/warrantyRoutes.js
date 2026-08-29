import express from 'express';
import { getUserWarranties, claimWarranty } from '../controllers/warrantyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure routes

router.get('/', getUserWarranties);
router.post('/:id/claim', claimWarranty);

export default router;
