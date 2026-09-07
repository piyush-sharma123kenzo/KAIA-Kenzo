import mongoose from 'mongoose';

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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal retrieval
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, referenceType: 1, referenceId: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
