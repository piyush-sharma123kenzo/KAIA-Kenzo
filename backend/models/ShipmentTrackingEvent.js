import mongoose from 'mongoose';

const shipmentTrackingEventSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      required: true,
      index: true,
    },
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    eventTime: {
      type: Date,
      default: Date.now,
    },
    providerEventId: {
      type: String,
      sparse: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['ProviderWebhook', 'CarrierAPI', 'BrandDispatch', 'AdminIntervention', 'System'],
      default: 'ProviderWebhook',
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization
shipmentTrackingEventSchema.pre('save', function (next) {
  if (!this.timestamp && this.eventTime) this.timestamp = this.eventTime;
  if (!this.eventTime && this.timestamp) this.eventTime = this.timestamp;
  next();
});

// Idempotent indexing
shipmentTrackingEventSchema.index({ shipmentId: 1, status: 1, timestamp: 1 }, { unique: true });
shipmentTrackingEventSchema.index({ shipmentId: 1, providerEventId: 1 });

const ShipmentTrackingEvent =
  mongoose.models.ShipmentTrackingEvent || mongoose.model('ShipmentTrackingEvent', shipmentTrackingEventSchema);

export default ShipmentTrackingEvent;
