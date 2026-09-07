import express from 'express';
import {
  getUserCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All cart routes require user login

// Standard REST & Compatibility Endpoints
router.get('/', getUserCart);
router.post('/', addToCart);
router.post('/add', addToCart);
router.post('/items', addToCart);
router.post('/item', addToCart);

// Update quantity routes
router.put('/update', updateCartItem);
router.patch('/update', updateCartItem);
router.patch('/item/:productId', updateCartItem);
router.patch('/items/:productId', updateCartItem);

// Remove item routes
router.delete('/item/:productId', removeCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/:productId', removeCartItem);
router.delete('/remove', removeCartItem);
router.post('/remove', removeCartItem);

// Clear cart
router.delete('/clear', clearCart);
router.delete('/', clearCart);

// Merge/Sync guest cart
router.post('/merge', syncCart);
router.post('/sync', syncCart);

export default router;

