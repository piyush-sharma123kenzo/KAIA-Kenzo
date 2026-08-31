import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    brandName: { type: String, required: true },
    sku: { type: String, default: '' },
    hsnCode: { type: String, default: '8517' }, // Electronics default HSN
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    taxRate: { type: Number, required: true, default: 18 }, // % GST
    taxAmount: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    serialNumbers: [{ type: String }],
    imeiNumbers: [{ type: String }],
    warrantyMonths: { type: Number, default: 12 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
      unique: true, // Exactly 1 official invoice per SellerOrder (Idempotent)
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    invoiceStatus: {
      type: String,
      enum: ['Issued', 'Paid', 'Cancelled', 'Refunded'],
      default: 'Paid',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Snapshotted Seller / Brand Entity Details
    sellerDetails: {
      legalBusinessName: { type: String, required: true },
      brandName: { type: String, required: true },
      businessAddress: { type: String, required: true },
      gstin: { type: String, default: '' },
      pan: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      state: { type: String, default: 'Karnataka' },
    },

    // Snapshotted Customer Details
    customerDetails: {
      customerName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      customerGSTIN: { type: String, default: '' },
    },

    billingAddress: {
      fullName: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone: { type: String, default: '' },
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      phone: { type: String, default: '' },
    },

    items: [invoiceItemSchema],

    // Financial Breakdown
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    // Payment Reference
    paymentReference: {
      provider: { type: String, default: 'razorpay' },
      paymentId: { type: String, default: '' },
      method: { type: String, default: 'Prepaid (Gateway)' },
      paidAt: { type: Date, default: Date.now },
    },

    // Warranty Breakdown
    warrantyDetails: [
      {
        productName: { type: String },
        serialNumber: { type: String },
        warrantyMonths: { type: Number, default: 12 },
        startDate: { type: Date },
        endDate: { type: Date },
        terms: { type: String, default: '1 Year Manufacturer Limited Hardware Warranty' },
      },
    ],

    pdfUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ brandId: 1, issuedAt: -1 });
invoiceSchema.index({ customerId: 1, issuedAt: -1 });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;
