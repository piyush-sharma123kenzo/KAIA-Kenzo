import React, { useState, useEffect, useContext } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { CartContext } from '../../context/CartContext';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/account/wishlist');
      if (res.data.success) {
        setItems(res.data.wishlist || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await axiosInstance.delete(`/account/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.product?._id !== productId));
      setActionMsg({ type: 'success', text: 'Item removed from your wishlist.' });
      setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Error removing item from wishlist.' });
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      await addToCart(product, 1);
      await handleRemove(product._id);
      setActionMsg({ type: 'success', text: `Moved ${product.name} to your shopping cart!` });
    } catch (err) {
      console.error('Error moving to cart:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8 pb-24 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
              My Saved Wishlist ({items.length})
            </h1>
          </div>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Your saved hardware items with live inventory status and direct cart allocations.
          </p>
        </div>

        <Link to="/products">
          <Button variant="outline" size="sm" className="text-xs uppercase font-bold">
            Continue Shopping
          </Button>
        </Link>
      </div>

      {actionMsg.text && (
        <div className={`p-3 rounded-sm text-xs font-bold ${
          actionMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* 2. Wishlist Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-4">
          <Heart className="w-16 h-16 text-brand-gray-300 mx-auto" />
          <h2 className="text-xl font-black text-brand-gray-900 uppercase">Your Wishlist is Empty</h2>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            Explore our curated catalog of enterprise electronics, gaming hardware, and peripherals to save products you love.
          </p>
          <Link to="/products">
            <Button size="sm" className="text-xs uppercase font-bold mt-2">
              Explore Catalog →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product || {};
            const isAvailable = product.isActive && (product.stockQuantity > 0 || product.stock > 0);

            return (
              <div
                key={item._id}
                className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-4 flex flex-col justify-between space-y-3 group hover:border-brand-accent transition-all"
              >
                <div>
                  {/* Product Image */}
                  <div className="h-44 bg-brand-light rounded border border-brand-gray-100 flex items-center justify-center p-3 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-brand-gray-300" />
                    )}

                    <button
                      onClick={() => handleRemove(product._id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-brand-gray-400 hover:text-red-600 rounded-full shadow-sm transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Brand & Name */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-brand-gray-400 uppercase block font-mono">
                      {product.brand?.name || 'Authorized Brand'}
                    </span>
                    <Link
                      to={`/product/${product.slug || product._id}`}
                      className="font-bold text-xs text-brand-gray-900 hover:text-brand-accent line-clamp-2 mt-0.5"
                    >
                      {product.name}
                    </Link>
                  </div>
                </div>

                {/* Price & Action Strip */}
                <div className="pt-3 border-t border-brand-gray-100 space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-black text-brand-gray-900 font-mono">
                      ₹{product.sellingPrice?.toLocaleString('en-IN')}
                    </span>
                    {product.mrp && product.mrp > product.sellingPrice && (
                      <span className="text-xs text-brand-gray-400 line-through font-mono">
                        ₹{product.mrp?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleMoveToCart(product)}
                    disabled={!isAvailable}
                    className="w-full text-xs uppercase font-bold flex items-center justify-center space-x-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isAvailable ? 'Move to Cart' : 'Out of Stock'}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Wishlist;
