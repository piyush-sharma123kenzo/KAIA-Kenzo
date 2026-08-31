import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    name: {
      // Alias for backward compatibility
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 (Flat/House/Building) is required'],
      trim: true,
    },
    addressLine2: {
      type: String,
      default: '',
      trim: true,
    },
    landmark: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    label: {
      // Alias for type
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: sync alias fields (fullName <-> name, type <-> label)
addressSchema.pre('save', function (next) {
  if (this.fullName && !this.name) this.name = this.fullName;
  if (this.name && !this.fullName) this.fullName = this.name;
  if (this.type && !this.label) this.label = this.type;
  if (this.label && !this.type) this.type = this.label;
  next();
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

export default Address;
