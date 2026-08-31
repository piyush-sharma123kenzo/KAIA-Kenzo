import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'PERCENTAGE', 'FIXED'],
      default: 'percentage',
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED', 'percentage', 'fixed'],
    },
    value: {
      type: Number,
    },
    minimumOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 1000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    fundingType: {
      type: String,
      enum: ['marketplace-funded', 'brand-funded', 'shared'],
      default: 'marketplace-funded',
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'disabled'],
      default: 'active',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.pre('save', function (next) {
  if (!this.type) this.type = this.discountType.toUpperCase();
  if (!this.discountType) this.discountType = this.type.toLowerCase();
  if (this.value === undefined) this.value = this.discountValue;
  if (this.discountValue === undefined) this.discountValue = this.value;
  if (!this.expiryDate && this.endDate) this.expiryDate = this.endDate;
  if (!this.endDate && this.expiryDate) this.endDate = this.expiryDate;
  next();
});

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default Coupon;
