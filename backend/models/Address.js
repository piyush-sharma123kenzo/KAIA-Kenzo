import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
export default Address;
