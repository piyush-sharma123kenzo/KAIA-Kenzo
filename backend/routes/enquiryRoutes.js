import express from 'express';
import { 
  submitDirectSupplyEnquiry, 
  getAdminEnquiries, 
  updateAdminEnquiry 
} from '../controllers/enquiryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public submission
router.post('/direct-supply', submitDirectSupplyEnquiry);

// Admin endpoints
router.get('/admin', protect, authorize('ADMIN'), getAdminEnquiries);
router.put('/admin/:id', protect, authorize('ADMIN'), updateAdminEnquiry);

export default router;
