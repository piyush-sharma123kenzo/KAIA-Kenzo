import express from 'express';
import { 
  submitSupportTicket, 
  getAdminTickets, 
  updateAdminTicketStatus, 
  replyAdminTicket 
} from '../controllers/supportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public / Customer endpoint
router.post('/tickets', submitSupportTicket);

// Admin endpoints
router.get('/admin', protect, authorize('ADMIN'), getAdminTickets);
router.put('/admin/:id/status', protect, authorize('ADMIN'), updateAdminTicketStatus);
router.post('/admin/:id/reply', protect, authorize('ADMIN'), replyAdminTicket);

export default router;
