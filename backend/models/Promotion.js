import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    placement: {
      type: String,
      enum: [
        'hero_banner',
        'featured_brands',
        'featured_categories',
        'featured_products',
        'deals_of_the_day',
        'new_arrivals',
        'best_sellers',
        'announcement_bar',
      ],
      required: true,
      index: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    targetUrl: {
      type: String,
      default: '',
    },
    ctaText: {
      type: String,
      default: 'Shop Now',
    },
    featuredProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    featuredBrands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
      },
    ],
    featuredCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

promotionSchema.index({ placement: 1, isActive: 1, displayOrder: 1 });

const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);
export default Promotion;
