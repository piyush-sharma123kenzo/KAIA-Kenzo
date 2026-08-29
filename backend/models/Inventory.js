import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;
