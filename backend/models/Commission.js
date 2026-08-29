import mongoose from 'mongoose';

const CommissionSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Commission = mongoose.models.Commission || mongoose.model('Commission', commissionSchema);
export default Commission;
