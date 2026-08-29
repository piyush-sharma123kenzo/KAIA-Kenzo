import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Post-save hook to recalculate product rating average and count
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const reviews = await this.constructor.find({ product: this.product });
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(this.product, {
    ratings: {
      average: Math.round(average * 10) / 10,
      count: reviews.length,
    },
  });
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
