/**
 * KAIA Technologies — Enterprise Review & Rating Service
 * 
 * Responsibilities:
 *  - Verified purchase & delivered order verification
 *  - Rating validation (strictly 1 to 5)
 *  - Atomic calculation of product rating aggregate & distribution
 *  - Review moderation & ownership enforcement
 */

import mongoose from 'mongoose';
import Review from '../../models/Review.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';

/**
 * Recalculate and synchronize product ratings and count based on visible/approved reviews.
 * @param {string|mongoose.Types.ObjectId} productId
 * @returns {Promise<{ average: number, count: number }>}
 */
export const syncProductRatingAggregate = async (productId) => {
  try {
    const pId = new mongoose.Types.ObjectId(productId);
    
    const stats = await Review.aggregate([
      { $match: { product: pId, isHidden: false } },
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const count = stats[0]?.count || 0;
    const average = count > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

    await Product.findByIdAndUpdate(productId, {
      $set: {
        'ratings.average': average,
        'ratings.count': count,
        reviewCount: count,
      },
    });

    return { average, count };
  } catch (err) {
    console.error('[ReviewService] Error synchronizing product rating aggregate:', err.message);
    return { average: 0, count: 0 };
  }
};

/**
 * Check if an authenticated user is eligible to review a product based on delivered orders.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} productId
 * @returns {Promise<{ isEligible: boolean, hasPurchased: boolean, isDelivered: boolean, alreadyReviewed: boolean, existingReview: object|null, orderId: string|null, reason?: string }>}
 */
export const checkUserReviewEligibility = async (userId, productId) => {
  if (!userId || !productId) {
    return {
      isEligible: false,
      hasPurchased: false,
      isDelivered: false,
      alreadyReviewed: false,
      existingReview: null,
      orderId: null,
      reason: 'Authentication and product identification required.',
    };
  }

  const prodIdStr = productId.toString();

  // 1. Check if an active review already exists
  const existingReview = await Review.findOne({ user: userId, product: productId }).lean();

  // 2. Query customer's paid orders
  const orders = await Order.find({
    customer: userId,
    paymentStatus: 'Paid',
  }).populate('childOrders').lean();

  let hasPurchased = false;
  let isDelivered = false;
  let purchaseOrderId = null;

  const deliveredStatuses = ['Delivered', 'delivered', 'Completed', 'completed'];

  for (const order of orders) {
    const isParentDelivered = deliveredStatuses.includes(order.orderStatus || '');

    // Check direct items
    if (order.items && order.items.some((it) => it.product?.toString() === prodIdStr)) {
      hasPurchased = true;
      if (isParentDelivered) {
        isDelivered = true;
        purchaseOrderId = order._id;
        break;
      }
    }

    // Check split child orders
    if (order.childOrders && Array.isArray(order.childOrders)) {
      for (const child of order.childOrders) {
        const itemMatch = (child.items || []).some((it) => it.product?.toString() === prodIdStr);
        if (itemMatch) {
          hasPurchased = true;
          const isChildDelivered = deliveredStatuses.includes(child.status || child.orderStatus || '');
          if (isParentDelivered || isChildDelivered) {
            isDelivered = true;
            purchaseOrderId = order._id;
            break;
          }
        }
      }
    }

    if (isDelivered) break;
  }

  if (!hasPurchased) {
    return {
      isEligible: false,
      hasPurchased: false,
      isDelivered: false,
      alreadyReviewed: Boolean(existingReview),
      existingReview,
      orderId: null,
      reason: 'Only customers who have purchased this product can leave a verified review.',
    };
  }

  if (!isDelivered) {
    return {
      isEligible: false,
      hasPurchased: true,
      isDelivered: false,
      alreadyReviewed: Boolean(existingReview),
      existingReview,
      orderId: purchaseOrderId,
      reason: 'Reviews can only be submitted once your order has been successfully delivered.',
    };
  }

  return {
    isEligible: true,
    hasPurchased: true,
    isDelivered: true,
    alreadyReviewed: Boolean(existingReview),
    existingReview,
    orderId: purchaseOrderId,
  };
};

/**
 * Create or update a customer review with strict validation.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.userName
 * @param {string} params.productId
 * @param {number} params.rating
 * @param {string} [params.title]
 * @param {string} params.comment
 * @returns {Promise<{ success: boolean, review: object, isNew: boolean }>}
 */
export const submitCustomerReview = async ({ userId, userName, productId, rating, title = '', comment }) => {
  // 1. Validate rating bounds
  const numRating = Number(rating);
  if (!numRating || isNaN(numRating) || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
    const error = new Error('Rating must be an integer between 1 and 5 stars.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate comment content
  if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
    const error = new Error('Review comment must contain at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (comment.trim().length > 2000) {
    const error = new Error('Review comment cannot exceed 2,000 characters.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify purchase & delivery eligibility
  const eligibility = await checkUserReviewEligibility(userId, productId);
  if (!eligibility.isEligible) {
    const error = new Error(eligibility.reason || 'Not eligible to review this product.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Upsert review (enforces single review per customer per product)
  const existing = await Review.findOne({ user: userId, product: productId });
  const isNew = !existing;

  const review = await Review.findOneAndUpdate(
    { user: userId, product: productId },
    {
      $set: {
        user: userId,
        product: productId,
        name: userName || 'Verified Customer',
        rating: numRating,
        title: title ? title.trim().slice(0, 150) : '',
        comment: comment.trim(),
        isVerifiedPurchase: true,
        orderId: eligibility.orderId,
        isHidden: false,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 5. Recalculate product aggregate ratings
  await syncProductRatingAggregate(productId);

  return {
    success: true,
    review,
    isNew,
  };
};

/**
 * Remove review document safely and recompute product rating average.
 * @param {string} reviewId
 * @param {string} userId - Requesting user
 * @param {boolean} isAdmin - Whether the caller is an administrator
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const removeReview = async (reviewId, userId, isAdmin = false) => {
  const query = isAdmin ? { _id: reviewId } : { _id: reviewId, user: userId };
  const review = await Review.findOne(query);

  if (!review) {
    const error = new Error('Review not found or unauthorized to delete.');
    error.statusCode = 404;
    throw error;
  }

  const productId = review.product;
  await Review.deleteOne({ _id: review._id });

  // Recalculate product rating aggregate
  await syncProductRatingAggregate(productId);

  return {
    success: true,
    message: 'Review removed successfully.',
  };
};

export default {
  syncProductRatingAggregate,
  checkUserReviewEligibility,
  submitCustomerReview,
  removeReview,
};
