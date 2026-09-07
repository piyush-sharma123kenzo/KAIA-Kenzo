import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import {
  submitCustomerReview,
  checkUserReviewEligibility,
  removeReview,
  syncProductRatingAggregate,
} from '../services/review/review.service.js';

// @desc    Add or update review for a product
// @route   POST /api/reviews
// @access  Private
export const addReview = async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  try {
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const result = await submitCustomerReview({
      userId: req.user._id,
      userName: req.user.name,
      productId,
      rating,
      title,
      comment,
    });

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Verified review submitted successfully.' : 'Review updated successfully.',
      review: result.review,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Error submitting review.' });
  }
};

// @desc    Get product reviews with distribution & pagination
// @route   GET /api/reviews/:productId or GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sort = 'newest' } = req.query;

  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Resolve productId if slug was passed
    let pId = productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId }).select('_id');
      if (prod) pId = prod._id;
    }

    const matchQuery = { product: new mongoose.Types.ObjectId(pId), isHidden: false };
    if (rating && rating !== 'all') {
      matchQuery.rating = Number(rating);
    }

    const sortOption = sort === 'highest' ? { rating: -1 } : sort === 'lowest' ? { rating: 1 } : { createdAt: -1 };

    const [reviews, totalMatching, allReviewsStats] = await Promise.all([
      Review.find(matchQuery)
        .populate('user', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(matchQuery),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(pId), isHidden: false } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const totalAll = allReviewsStats.reduce((acc, curr) => acc + curr.count, 0);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviewsStats.forEach((b) => {
      if (distribution[b._id] !== undefined) distribution[b._id] = b.count;
    });

    const averageRating = totalAll > 0
      ? Math.round((allReviewsStats.reduce((sum, b) => sum + (b._id * b.count), 0) / totalAll) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      reviews,
      total: totalMatching,
      totalAll,
      averageRating,
      distribution,
      page: pageNum,
      totalPages: Math.ceil(totalMatching / limitNum) || 1,
    });
  } catch (error) {
    console.error('[ReviewController] getProductReviews error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching product reviews.' });
  }
};

// @desc    Check if current user is eligible to review product
// @route   GET /api/reviews/:productId/eligibility
// @access  Private
export const getReviewEligibility = async (req, res) => {
  const { productId } = req.params;

  try {
    let pId = productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId }).select('_id');
      if (prod) pId = prod._id;
    }

    const eligibility = await checkUserReviewEligibility(req.user._id, pId);
    res.status(200).json({ success: true, ...eligibility });
  } catch (error) {
    console.error('[ReviewController] getReviewEligibility error:', error.message);
    res.status(500).json({ success: false, message: 'Error checking review eligibility.' });
  }
};

// @desc    Delete user review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const isAdmin = (req.user?.role || '').toUpperCase() === 'ADMIN';
    const result = await removeReview(id, req.user._id, isAdmin);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Error deleting review.' });
  }
};
