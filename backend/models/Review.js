import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One review per customer per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Post-save hook to recalculate product rating average and count
reviewSchema.post('save', async function () {
  try {
    const Product = mongoose.model('Product');
    const reviews = await this.constructor.find({ product: this.product, isHidden: false });
    if (reviews.length > 0) {
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(this.product, {
        ratings: {
          average: Math.round(average * 10) / 10,
          count: reviews.length,
        },
      });
    }
  } catch (err) {
    console.error('Error updating product rating average:', err);
  }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
