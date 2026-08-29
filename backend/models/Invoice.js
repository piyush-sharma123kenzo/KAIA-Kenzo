import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;
