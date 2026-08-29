import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @desc    Add review for a product
// @route   POST /api/reviews
// @access  Private
export const addReview = async (req, res) => {
  const { productId, rating, comment } = req.body;

  try {
    // Premium feature: check if user has purchased this product
    const orders = await Order.find({ customer: req.user._id, paymentStatus: 'Paid' }).populate('childOrders');
    let hasPurchased = false;

    for (let order of orders) {
      for (let childOrder of order.childOrders) {
        const itemPurchased = childOrder.items.some(
          (item) => item.product.toString() === productId
        );
        if (itemPurchased) {
          hasPurchased = true;
          break;
        }
      }
      if (hasPurchased) break;
    }

    if (!hasPurchased) {
      return res.status(403).json({
        message: 'Only customers who have purchased this product can leave a review.',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      existingReview.rating = Number(rating);
      existingReview.comment = comment;
      await existingReview.save();

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully.',
        review: existingReview,
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully.',
      review,
    });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ message: 'Server error posting review.' });
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product reviews.' });
  }
};
