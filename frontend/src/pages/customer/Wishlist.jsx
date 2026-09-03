import React, { useState, useEffect, useContext } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, ShoppingCart, Star, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { CartContext } from '../../context/CartContext';
import { getAccurateProductImage } from '../../utils/productImageMap';
import { Skeleton } from '../../components/feedback/Skeleton';
import Container from '../../components/ui/Container';
import ViewModeSwitch from '../../components/ui/ViewModeSwitch';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext) || {};
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
  const [movingId, setMovingId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('kaia_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('kaia_view_mode', mode);
    } catch {}
  };

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/account/wishlist');
      if (res.data?.success) {
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
      setItems((prev) => prev.filter((i) => (i.product?._id || i.product?.id) !== productId));
      setActionMsg({ type: 'success', text: 'Item removed from your wishlist.' });
      setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Error removing item from wishlist.' });
      setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleMoveToCart = async (product) => {
    const pId = product._id || product.id;
    if (!addToCart || !pId) return;
    setMovingId(pId);
    try {
      await addToCart(product, 1);
      await handleRemove(pId);
      setActionMsg({ type: 'success', text: `Moved ${product.name || 'item'} to your shopping cart!` });
    } catch (err) {
      console.error('Error moving to cart:', err);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-[85vh] text-left font-sans">
      <Container className="space-y-8 max-w-7xl">
        
        {/* 1. Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
              <Link to="/" className="hover:text-amber-600">Home</Link>
              <span>/</span>
              <span className="text-slate-900">Wishlist</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-xs">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                My Saved Wishlist
              </h1>
              <span className="text-xs font-bold text-slate-600 bg-slate-200/70 px-2.5 py-1 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Your saved hardware products with live inventory status, price tracking, and instant cart transfer.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <ViewModeSwitch
              viewMode={viewMode}
              onChange={handleViewModeChange}
              size="sm"
            />

            <Link to="/products">
              <button className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-2xs hover:bg-slate-100/80 transition-all flex items-center space-x-2 cursor-pointer">
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionMsg.text && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold border transition-all ${
              actionMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {actionMsg.text}
          </div>
        )}

        {/* 2. Content: Loading / Empty / Populated */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200/90 p-12 md:p-16 rounded-3xl text-center shadow-sm space-y-5 max-w-xl mx-auto">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl mx-auto flex items-center justify-center shadow-inner border border-rose-100">
              <Heart className="w-10 h-10 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Explore our curated catalog of enterprise electronics, gaming hardware, and components to save products you love.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/products">
                <button className="bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
                  Explore Hardware Catalog →
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'list' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}>
            {items.map((item) => {
              const product = item.product || {};
              const pId = product._id || product.id || item._id;
              const name = product.name || 'Hardware Product';
              const brandName = typeof product.brand === 'string' ? product.brand : product.brand?.name || 'Authorized Brand';
              const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
              const mrp = Number(product.mrp ?? sellingPrice);
              const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
              const isAvailable = (product.stockQuantity ?? product.stock ?? 10) > 0;
              const imageUrl = getAccurateProductImage(product);
              const isMoving = movingId === pId;

              if (viewMode === 'list') {
                return (
                  <div
                    key={pId}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs hover:shadow-lg hover:border-amber-400/50 transition-all duration-200 group text-left relative overflow-hidden"
                  >
                    {/* Left: Thumbnail Image */}
                    <Link
                      to={`/product/${product.slug || pId}`}
                      className="w-full md:w-48 h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-3 relative shrink-0 group-hover:border-amber-300/40 transition-colors"
                    >
                      <img
                        src={imageUrl}
                        alt={name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80';
                        }}
                      />
                      {discount > 0 && (
                        <div className="absolute bottom-2 left-2 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs">
                          {discount}% OFF
                        </div>
                      )}
                    </Link>

                    {/* Middle: Content & Specs */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
                          {brandName}
                        </span>
                        <span className={`text-[10px] font-bold ${isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isAvailable ? 'In Stock — Ships within 24h' : 'Currently Out of Stock'}
                        </span>
                      </div>

                      <Link
                        to={`/product/${product.slug || pId}`}
                        className="font-bold text-sm md:text-base text-slate-900 hover:text-amber-700 line-clamp-2 leading-snug transition-colors block"
                      >
                        {name}
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description || 'Premium genuine electronics with full brand manufacturer warranty and express delivery.'}
                      </p>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="w-full md:w-52 shrink-0 md:border-l md:border-slate-100 md:pl-5 space-y-3 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg md:text-xl font-black text-slate-950 block tracking-tight font-mono">
                            ₹{sellingPrice.toLocaleString('en-IN')}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              ₹{mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Free Express Delivery</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveToCart(product)}
                          disabled={!isAvailable || isMoving}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer ${
                            isMoving
                              ? 'bg-emerald-600 text-white'
                              : !isAvailable
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 active:scale-95'
                          }`}
                        >
                          {isMoving ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Moving...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Move to Cart</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleRemove(pId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-amber-400/50 transition-all duration-200 group text-left relative overflow-hidden"
                >
                  <div>
                    {/* Top Brand Pill & Delete Button */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
                        {brandName}
                      </span>
                      <button
                        onClick={() => handleRemove(pId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50 transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image Box */}
                    <Link
                      to={`/product/${product.slug || pId}`}
                      className="h-44 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-3 relative overflow-hidden block mb-3 group-hover:border-amber-300/40 transition-colors"
                    >
                      <img
                        src={imageUrl}
                        alt={name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80';
                        }}
                      />
                      {discount > 0 && (
                        <div className="absolute bottom-2 left-2 bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                          {discount}% OFF
                        </div>
                      )}
                    </Link>

                    {/* Title */}
                    <Link
                      to={`/product/${product.slug || pId}`}
                      className="font-bold text-xs text-slate-800 hover:text-amber-700 line-clamp-2 leading-snug transition-colors"
                      title={name}
                    >
                      {name}
                    </Link>
                  </div>

                  {/* Price & Action Button */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5 mt-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base font-black text-slate-950 font-mono">
                          ₹{sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            ₹{mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold ${isAvailable ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMoveToCart(product)}
                      disabled={!isAvailable || isMoving}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer ${
                        isMoving
                          ? 'bg-emerald-600 text-white'
                          : !isAvailable
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 active:scale-95'
                      }`}
                    >
                      {isMoving ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Moving to Cart...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'Move to Cart' : 'Out of Stock'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Wishlist;
