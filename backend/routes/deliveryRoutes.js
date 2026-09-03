import express from 'express';
import {
  checkDeliveryAvailability,
  getActiveLocations,
  getAdminDeliveryLocations,
  createDeliveryLocation,
  updateDeliveryLocation,
  toggleDeliveryLocationStatus,
  deleteDeliveryLocation,
  getDeliveryAnalytics,
} from '../controllers/deliveryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// PUBLIC DELIVERY CHECK ROUTES
// ============================================================================

// POST /api/delivery/check - Verify delivery eligibility by PIN or Coordinates
router.post('/check', checkDeliveryAvailability);

// GET /api/delivery/locations - Fetch active service locations
router.get('/locations', getActiveLocations);

// ============================================================================
// ADMIN SERVICEABLE LOCATION MANAGEMENT ROUTES
// ============================================================================

// All admin routes below require ADMIN authorization
router.use('/admin', protect, authorize('ADMIN'));

// GET /api/delivery/admin/locations - List delivery locations (paginated & searchable)
router.get('/admin/locations', getAdminDeliveryLocations);

// GET /api/delivery/admin/analytics - Delivery availability analytics
router.get('/admin/analytics', getDeliveryAnalytics);

// POST /api/delivery/admin/locations - Create a new delivery location
router.post('/admin/locations', createDeliveryLocation);

// PUT /api/delivery/admin/locations/:id - Update an existing location
router.put('/admin/locations/:id', updateDeliveryLocation);

// PATCH /api/delivery/admin/locations/:id/status - Toggle location active status
router.patch('/admin/locations/:id/status', toggleDeliveryLocationStatus);

// DELETE /api/delivery/admin/locations/:id - Delete a delivery location
router.delete('/admin/locations/:id', deleteDeliveryLocation);

export default router;
