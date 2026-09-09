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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.virtual('createdAtIST').get(function () {
  return formatIST(this.createdAt);
});

cartSchema.virtual('updatedAtIST').get(function () {
  return formatIST(this.updatedAt);
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
