import express from 'express';
import {
  getAccountOverview,
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getCustomerReviews,
  createOrUpdateReview,
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getCustomerInvoices,
  getCustomerWarranties,
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All account routes require customer authentication
router.use(protect);

// 1. Overview & Profile
router.get('/overview', getAccountOverview);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/change-password', changePassword);

// 2. Address Management
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/addresses/:id/default', setDefaultAddress);

// 3. Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// 4. Reviews & Verified Purchases
router.get('/reviews', getCustomerReviews);
router.post('/reviews', createOrUpdateReview);

// 5. Notifications
router.get('/notifications', getCustomerNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.post('/notifications/read-all', markAllNotificationsAsRead);

// 6. Post-Purchase Invoices & Warranties
router.get('/invoices', getCustomerInvoices);
router.get('/warranty', getCustomerWarranties);
router.get('/warranties', getCustomerWarranties);

export default router;
