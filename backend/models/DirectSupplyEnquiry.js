import mongoose from 'mongoose';

const directSupplyEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company / Organization Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Corporate Email Address is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    productRequirement: {
      type: String,
      required: [true, 'Product requirement is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Target quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    targetTimeline: {
      type: String,
      default: 'Within 30 Days',
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Contacted', 'Resolved', 'Closed'],
      default: 'New',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const DirectSupplyEnquiry = mongoose.models.DirectSupplyEnquiry || mongoose.model('DirectSupplyEnquiry', directSupplyEnquirySchema);
export default DirectSupplyEnquiry;
