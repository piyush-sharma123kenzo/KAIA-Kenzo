import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All wishlist actions require user authentication

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/add', addToWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
