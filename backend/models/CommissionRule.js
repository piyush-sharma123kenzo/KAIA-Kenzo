import mongoose from 'mongoose';

const commissionRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ['marketplace_default', 'brand', 'category', 'product'],
      required: true,
      default: 'marketplace_default',
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
      required: true,
    },
    commissionValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Optional GST on Platform Commission fee (e.g. 18%)
    commissionTaxRate: {
      type: Number,
      default: 18.0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    history: [
      {
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        previousValue: Number,
        newValue: Number,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

commissionRuleSchema.index({ scope: 1, isActive: 1 });
commissionRuleSchema.index({ brandId: 1, isActive: 1 });
commissionRuleSchema.index({ categoryId: 1, isActive: 1 });
commissionRuleSchema.index({ productId: 1, isActive: 1 });

const CommissionRule = mongoose.models.CommissionRule || mongoose.model('CommissionRule', commissionRuleSchema);
export default CommissionRule;
