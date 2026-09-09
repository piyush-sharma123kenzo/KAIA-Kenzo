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
  bulkCreateDeliveryLocations,
  seedDefaultDeliveryLocations,
} from '../controllers/deliveryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// PUBLIC DELIVERY CHECK ROUTES
// ============================================================================

// POST /api/delivery/check - Verify delivery eligibility by PIN or Coordinates
router.post('/check', checkDeliveryAvailability);

// GET /api/delivery/locations & /api/delivery/zones - Fetch active service locations
router.get('/locations', getActiveLocations);
router.get('/zones', getActiveLocations);

// ============================================================================
// ADMIN SERVICEABLE LOCATION MANAGEMENT ROUTES
// ============================================================================

// All admin routes below require ADMIN authorization
router.use('/admin', protect, authorize('ADMIN'));

// GET /api/delivery/admin/locations & /api/delivery/admin/zones - List delivery locations
router.get('/admin/locations', getAdminDeliveryLocations);
router.get('/admin/zones', getAdminDeliveryLocations);

// GET /api/delivery/admin/analytics - Delivery availability analytics
router.get('/admin/analytics', getDeliveryAnalytics);

// POST /api/delivery/admin/seed-defaults - Seed default major metro hubs
router.post('/admin/seed-defaults', seedDefaultDeliveryLocations);

// POST /api/delivery/admin/bulk-locations - Bulk create multiple delivery locations
router.post('/admin/bulk-locations', bulkCreateDeliveryLocations);

// POST /api/delivery/admin/locations & /api/delivery/admin/zones - Create a new delivery location
router.post('/admin/locations', createDeliveryLocation);
router.post('/admin/zones', createDeliveryLocation);

// PUT & PATCH /api/delivery/admin/locations/:id & /api/delivery/admin/zones/:id - Update an existing location
router.put('/admin/locations/:id', updateDeliveryLocation);
router.patch('/admin/locations/:id', updateDeliveryLocation);
router.put('/admin/zones/:id', updateDeliveryLocation);
router.patch('/admin/zones/:id', updateDeliveryLocation);

// PATCH /api/delivery/admin/locations/:id/status & /api/delivery/admin/zones/:id/status - Toggle location active status
router.patch('/admin/locations/:id/status', toggleDeliveryLocationStatus);
router.patch('/admin/zones/:id/status', toggleDeliveryLocationStatus);

// DELETE /api/delivery/admin/locations/:id & /api/delivery/admin/zones/:id - Delete a delivery location
router.delete('/admin/locations/:id', deleteDeliveryLocation);
router.delete('/admin/zones/:id', deleteDeliveryLocation);

export default router;
