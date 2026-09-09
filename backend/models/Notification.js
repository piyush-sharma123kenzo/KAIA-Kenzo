import mongoose from 'mongoose';
import { formatIST } from '../utils/dateFormat.js';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'AUTH',
        'ORDER',
        'PAYMENT',
        'SHIPPING',
        'DELIVERY',
        'PRODUCT',
        'BRAND',
        'ADMIN',
        'SYSTEM',
        'STOCK',
        'Order',
        'Inventory',
        'Approval',
        'Payment',
        'Alert',
        'General',
      ],
      default: 'General',
      index: true,
    },
    referenceType: {
      type: String,
      default: null,
    },
    referenceId: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
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

notificationSchema.pre('save', function (next) {
  const now = new Date();
  this.updatedAtIST = formatIST(now);
  if (!this.createdAtIST) {
    this.createdAtIST = formatIST(this.createdAt || now);
  }
  next();
});

// Compound indexes for optimal retrieval
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, referenceType: 1, referenceId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
