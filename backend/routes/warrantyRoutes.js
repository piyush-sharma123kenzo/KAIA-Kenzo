import express from 'express';
import { 
  getUserWarranties, 
  claimWarranty, 
  verifyPublicWarranty 
} from '../controllers/warrantyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public verification endpoint
router.get('/verify', verifyPublicWarranty);

// Customer protected endpoints
router.get('/', protect, getUserWarranties);
router.post('/:id/claim', protect, claimWarranty);

export default router;
