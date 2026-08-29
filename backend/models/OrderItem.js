import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const OrderItem = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);
export default OrderItem;
