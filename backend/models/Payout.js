import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
export default Payout;
