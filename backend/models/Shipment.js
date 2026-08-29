import mongoose from 'mongoose';

const ShipmentSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);
export default Shipment;
