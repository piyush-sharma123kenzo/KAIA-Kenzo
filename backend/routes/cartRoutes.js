import express from 'express';
import { getUserCart, addToCart, updateCartItem, removeCartItem, syncCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All cart routes require user login

router.get('/', getUserCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.post('/remove', removeCartItem);
router.post('/sync', syncCart);

export default router;
