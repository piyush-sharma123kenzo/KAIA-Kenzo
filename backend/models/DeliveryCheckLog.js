import mongoose from 'mongoose';

const deliveryCheckLogSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    isServiceable: {
      type: Boolean,
      required: true,
      index: true,
    },
    calculatedDistance: {
      type: Number,
      default: null,
    },
    deliveryRadius: {
      type: Number,
      default: null,
    },
    nearestLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryLocation',
    },
    nearestLocationName: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

deliveryCheckLogSchema.index({ createdAt: -1 });
deliveryCheckLogSchema.index({ isServiceable: 1, createdAt: -1 });

const DeliveryCheckLog = mongoose.model('DeliveryCheckLog', deliveryCheckLogSchema);
export default DeliveryCheckLog;
