import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
