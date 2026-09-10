import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'system_settings',
    },
    siteName: {
      type: String,
      default: 'KAIA Technologies',
    },
    siteLogo: {
      type: String,
      default: '/logo.png',
    },
    supportEmail: {
      type: String,
      default: 'kenzoinfosystemsprivatelimited@gmail.com',
    },
    supportPhone: {
      type: String,
      default: '+91 9811207024',
    },
    businessAddress: {
      street: { type: String, default: '32-C, Unit No 107, B.R. Complex, Mayur Vihar, Phase 1' },
      city: { type: String, default: 'East Delhi' },
      state: { type: String, default: 'Delhi' },
      postalCode: { type: String, default: '110091' },
      country: { type: String, default: 'India' },
    },
    deliverySettings: {
      defaultRadiusKm: { type: Number, default: 10 },
      radiusKm: { type: Number, default: 10 },
      freeDeliveryThreshold: { type: Number, default: 999 },
      freeShippingThreshold: { type: Number, default: 5000 },
      standardDeliveryCharge: { type: Number, default: 99 },
      standardDeliveryFee: { type: Number, default: 99 },
      serviceablePinCodes: [{ type: String }],
    },
    taxSettings: {
      defaultGstRate: { type: Number, default: 18.0 },
      pricesIncludeTax: { type: Boolean, default: true },
      gstin: { type: String, default: '29ABCDE1234F1Z5' },
    },
    orderSettings: {
      autoConfirmOrders: { type: Boolean, default: true },
      enableCashOnDelivery: { type: Boolean, default: true },
      returnWindowDays: { type: Number, default: 7 },
      autoCancelUnpaidMinutes: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
export default Setting;
