import mongoose from 'mongoose';
import { formatIST } from '../utils/dateFormat.js';

const wishlistProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required.'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    addedAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
  },
  { _id: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.'],
      unique: true,
      index: true,
    },
    products: [wishlistProductSchema],
    createdAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
    updatedAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

wishlistSchema.pre('save', function (next) {
  const now = new Date();
  this.updatedAtIST = formatIST(now);
  if (!this.createdAtIST) {
    this.createdAtIST = formatIST(this.createdAt || now);
  }
  if (Array.isArray(this.products)) {
    this.products.forEach((p) => {
      if (!p.addedAtIST) {
        p.addedAtIST = formatIST(p.addedAt || now);
      }
    });
  }
  next();
});

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;


