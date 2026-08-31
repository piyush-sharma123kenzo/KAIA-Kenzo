import mongoose from 'mongoose';

export const VALID_STATUSES = [
  'pending',
  'ready_to_ship',
  'label_generated',
  'pickup_scheduled',
  'picked_up',
  'in_transit',
  'reached_hub',
  'out_for_delivery',
  'delivery_attempted',
  'delivered',
  'cancelled',
  'lost',
  'damaged',
  'rto_initiated',
  'rto_in_transit',
  'rto_delivered',
];

// Valid allowed transitions state machine
export const ALLOWED_TRANSITIONS = {
  pending: ['ready_to_ship', 'label_generated', 'cancelled'],
  ready_to_ship: ['label_generated', 'pickup_scheduled', 'cancelled'],
  label_generated: ['pickup_scheduled', 'picked_up', 'cancelled'],
  pickup_scheduled: ['picked_up', 'in_transit', 'delivery_attempted', 'cancelled'],
  picked_up: ['in_transit', 'reached_hub', 'out_for_delivery', 'delivery_attempted', 'lost', 'damaged', 'rto_initiated'],
  in_transit: ['reached_hub', 'out_for_delivery', 'delivery_attempted', 'delivered', 'lost', 'damaged', 'rto_initiated'],
  reached_hub: ['out_for_delivery', 'in_transit', 'delivery_attempted', 'lost', 'damaged', 'rto_initiated'],
  out_for_delivery: ['delivered', 'delivery_attempted', 'lost', 'damaged', 'rto_initiated'],
  delivery_attempted: ['out_for_delivery', 'reached_hub', 'in_transit', 'rto_initiated', 'cancelled'],
  delivered: ['rto_initiated'], // In case of reverse return
  cancelled: [],
  lost: ['rto_initiated', 'cancelled'],
  damaged: ['rto_initiated', 'cancelled'],
  rto_initiated: ['rto_in_transit', 'rto_delivered', 'cancelled'],
  rto_in_transit: ['rto_delivered'],
  rto_delivered: [],
};

const shipmentItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    serialNumbers: [{ type: String }],
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    // Unique human-readable shipment identifier (e.g. SHIP-20260830-10023)
    shipmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shipmentNumber: {
      type: String,
      index: true,
    },
    // Order linkages
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Snapshotted item details
    items: [shipmentItemSchema],

    // Package dimensions & weight
    package: {
      length: { type: Number, required: true, min: 0.1, default: 10 }, // cm
      breadth: { type: Number, required: true, min: 0.1, default: 10 }, // cm
      height: { type: Number, required: true, min: 0.1, default: 10 }, // cm
      weight: { type: Number, required: true, min: 0.01, default: 0.5 }, // kg
      unit: { type: String, default: 'cm' },
      weightUnit: { type: String, default: 'kg' },
    },

    // Snapshotted pickup warehouse location (from Brand Warehouse)
    pickupAddress: {
      warehouseName: { type: String },
      name: { type: String, required: true },
      contactName: { type: String },
      phone: { type: String, required: true },
      address: { type: String },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },

    // Snapshotted customer delivery destination (from Order)
    shippingAddress: {
      fullName: { type: String, required: true },
      name: { type: String },
      phone: { type: String, required: true },
      address: { type: String },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },

    // Logistics & Courier details
    courierProvider: {
      type: String,
      enum: ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'mock', 'custom'],
      default: 'shiprocket',
    },
    courierName: {
      type: String,
      default: 'Blue Dart Express',
    },
    courier: {
      name: { type: String, default: 'Blue Dart Express' },
      code: { type: String, default: 'BLUEDART' },
      serviceType: { type: String, default: 'Standard Surface / Express' },
    },
    courierCode: {
      type: String,
      default: 'BLUEDART',
    },

    awbNumber: {
      type: String,
      default: '',
      index: true,
    },
    trackingNumber: {
      type: String,
      default: '',
      index: true,
    },

    shipmentStatus: {
      type: String,
      enum: VALID_STATUSES,
      default: 'ready_to_ship',
      index: true,
    },

    shippingLabelUrl: {
      type: String,
      default: '',
    },
    labelUrl: {
      type: String,
      default: '',
    },
    manifestUrl: {
      type: String,
      default: '',
    },
    trackingUrl: {
      type: String,
      default: '',
    },

    // Cost Breakdown: Customer shipping charge vs actual courier cost & marketplace subsidy
    customerShippingFee: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0, // Actual courier cost
    },
    marketplaceSubsidy: {
      type: Number,
      default: 0,
    },

    // High-Value Hardware Security & Insurance
    signatureRequired: {
      type: Boolean,
      default: false,
    },
    otpRequired: {
      type: Boolean,
      default: false,
    },
    insuredShipment: {
      type: Boolean,
      default: false,
    },
    insuranceAmount: {
      type: Number,
      default: 0,
    },
    insuranceProvider: {
      type: String,
      default: '',
    },

    estimatedDeliveryDate: {
      type: Date,
    },
    actualPickupDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },

    // Timestamp milestones
    pickupScheduledAt: { type: Date },
    pickedUpAt: { type: Date },
    shippedAt: { type: Date },
    reachedHubAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },

    failedAt: { type: Date },
    failureReason: { type: String, default: '' },

    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },

    returnedAt: { type: Date },
    returnReason: { type: String, default: '' },

    // External provider references (Shiprocket, Delhivery, Blue Dart)
    providerReference: {
      provider: { type: String, default: 'shiprocket' },
      providerOrderId: { type: String, default: '' },
      providerShipmentId: { type: String, default: '' },
      providerAwbCode: { type: String, default: '' },
      providerData: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization
shipmentSchema.pre('save', function (next) {
  if (!this.shipmentNumber) this.shipmentNumber = this.shipmentId;
  if (!this.labelUrl && this.shippingLabelUrl) this.labelUrl = this.shippingLabelUrl;
  if (!this.shippingLabelUrl && this.labelUrl) this.shippingLabelUrl = this.labelUrl;
  if (!this.courierName && this.courier?.name) this.courierName = this.courier.name;
  if (this.courierName && !this.courier?.name) {
    this.courier = this.courier || {};
    this.courier.name = this.courierName;
  }
  if (!this.trackingNumber && this.awbNumber) this.trackingNumber = this.awbNumber;
  if (!this.awbNumber && this.trackingNumber) this.awbNumber = this.trackingNumber;
  next();
});

shipmentSchema.index({ masterOrderId: 1, createdAt: -1 });
shipmentSchema.index({ brandId: 1, shipmentStatus: 1 });
shipmentSchema.index({ shipmentStatus: 1, createdAt: -1 });

const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
export default Shipment;
