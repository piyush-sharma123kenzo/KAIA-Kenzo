import express from 'express';
import {
  addReview,
  getProductReviews,
  getReviewEligibility,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public review retrieval
router.get('/:productId', getProductReviews);
router.get('/product/:productId', getProductReviews);

// Protected customer actions
router.get('/product/:productId/eligibility', protect, getReviewEligibility);
router.get('/:productId/eligibility', protect, getReviewEligibility);
router.post('/', protect, addReview);
router.patch('/:id', protect, addReview);
router.delete('/:id', protect, deleteReview);

export default router;
