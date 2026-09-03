import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAccountOverview,
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
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

// Avatar storage config
const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/avatars/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter(req, file, cb) {
    const filetypes = /jpg|jpeg|png|webp|avif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('image/');
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Images only (jpg, jpeg, png, webp, avif)!'));
    }
  },
});

// All account routes require customer authentication
router.use(protect);

// 1. Overview & Profile
router.get('/overview', getAccountOverview);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.any(), uploadAvatar);
router.delete('/avatar', removeAvatar);
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
