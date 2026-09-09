import mongoose from 'mongoose';
import { formatIST } from '../utils/dateFormat.js';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required.'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required.'],
      default: 1,
      min: [1, 'Quantity must be at least 1.'],
    },
    selectedSpecs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priceAtAdd: {
      type: Number,
      default: 0,
    },
    addedAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.'],
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
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

cartSchema.pre('save', function (next) {
  const now = new Date();
  this.updatedAtIST = formatIST(now);
  if (!this.createdAtIST) {
    this.createdAtIST = formatIST(this.createdAt || now);
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
