import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate wishlist item for the same customer
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
