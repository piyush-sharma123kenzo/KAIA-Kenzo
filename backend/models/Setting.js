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
      default: 'support@kaiatech.com',
    },
    supportPhone: {
      type: String,
      default: '+91 80000 12345',
    },
    businessAddress: {
      street: { type: String, default: 'Electronic City Phase 1' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560100' },
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
