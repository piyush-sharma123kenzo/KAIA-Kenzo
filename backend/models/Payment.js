import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
