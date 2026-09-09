import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  moveToCart,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All wishlist actions require user authentication

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/add', addToWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/clear', clearWishlist);
router.delete('/', clearWishlist);
router.post('/move-to-cart', moveToCart);
router.post('/:productId/move-to-cart', moveToCart);
router.delete('/item/:productId', removeFromWishlist);
router.delete('/remove', removeFromWishlist);
router.post('/remove', removeFromWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
