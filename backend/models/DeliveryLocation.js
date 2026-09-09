import mongoose from 'mongoose';

const deliveryLocationSchema = new mongoose.Schema(
  {
    locationName: {
      type: String,
      required: [true, 'Location name is required (e.g., Mayur Vihar Phase 1 Hub)'],
      trim: true,
      maxlength: [120, 'Location name cannot exceed 120 characters'],
    },
    address: {
      type: String,
      required: [true, 'Full address of the service center is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'Delhi',
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: 'Delhi',
    },
    pincode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian PIN code'],
      index: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude coordinate is required'],
        min: [-90, 'Latitude must be >= -90'],
        max: [90, 'Latitude must be <= 90'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude coordinate is required'],
        min: [-180, 'Longitude must be >= -180'],
        max: [180, 'Longitude must be <= 180'],
      },
    },
    deliveryRadius: {
      type: Number,
      required: [true, 'Delivery radius in KM is required'],
      default: 10,
      min: [0.5, 'Delivery radius must be at least 0.5 KM'],
      max: [100, 'Delivery radius cannot exceed 100 KM'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Compound index for active locations and PIN code
deliveryLocationSchema.index({ isActive: 1, pincode: 1 });
deliveryLocationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

const DeliveryLocation = mongoose.model('DeliveryLocation', deliveryLocationSchema);
export default DeliveryLocation;
