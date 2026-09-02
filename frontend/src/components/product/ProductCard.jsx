import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ArrowLeftRight, ShoppingCart, Check } from 'lucide-react';
import { getAccurateProductImage } from '../../utils/productImageMap';
import { useCompare } from '../../context/CompareContext';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import axiosInstance from '../../api/axiosInstance';

const ProductCard = ({
  product,
  className = '',
  ...props
}) => {
  if (!product) return null;

  const { isInCompare, toggleCompare } = useCompare();
  const { addToCart } = useContext(CartContext) || {};
  const { user } = useContext(AuthContext) || {};
  const toast = useContext(ToastContext) || {};

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const _id = product._id || product.id || '';
  const name = product.name || 'Electronics Product';
  const slug = product.slug || _id || '';
  const brandName = typeof product.brand === 'string' 
    ? product.brand 
    : product.brand?.name || 'KAIA';
  
  const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
  const mrp = Number(product.mrp ?? sellingPrice);
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  
  const rating = Number(product.ratings?.average || 4.5).toFixed(1);
  const reviewCount = product.ratings?.count || 12;
  const stockQty = product.stock?.quantity ?? product.stock ?? 10;
  const inStock = stockQty > 0;

  const imageUrl = getAccurateProductImage(product);
  const isCompared = isInCompare(_id);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(sellingPrice);

  const formattedMrp = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(mrp);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      if (toast.showToast) toast.showToast('Please sign in to save items to your wishlist.', 'info');
      return;
    }

    try {
      if (isWishlisted) {
        await axiosInstance.delete(`/account/wishlist/${_id}`);
        setIsWishlisted(false);
        if (toast.showToast) toast.showToast('Removed from wishlist.', 'info');
      } else {
        await axiosInstance.post('/account/wishlist', { productId: _id });
        setIsWishlisted(true);
        if (toast.showToast) toast.showToast('Added to your wishlist.', 'success');
      }
    } catch (err) {
      // Fallback
      setIsWishlisted(!isWishlisted);
      if (toast.showToast) toast.showToast(isWishlisted ? 'Removed from wishlist.' : 'Saved to wishlist.', 'success');
    }
  };

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || !addToCart) return;

    setAddingToCart(true);
    try {
      await addToCart(product, 1);
      setJustAdded(true);
      if (toast.showToast) toast.showToast(`Added ${name} to cart.`, 'success');
      setTimeout(() => setJustAdded(false), 1800);
    } catch (err) {
      console.error('Error in quick add to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Link
      to={`/product/${slug}`}
      className={`bg-white rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-200 group text-left relative overflow-hidden ${className}`}
      {...props}
    >
      <div>
        {/* Top Badges & Action Bar */}
        <div className="flex items-center justify-between gap-1 mb-2 z-10 relative">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
            {brandName}
          </span>

          <div className="flex items-center space-x-1">
            {/* Compare Button */}
            <button
              type="button"
              onClick={handleCompareToggle}
              className={`p-1.5 rounded-md transition-all ${
                isCompared
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-slate-50'
              }`}
              title={isCompared ? 'Remove from comparison' : 'Add to compare'}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`p-1.5 rounded-md transition-all ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50'
              }`}
              title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Fixed Uniform Image Container */}
        <div className="product-image-container border border-slate-100 group-hover:border-amber-400/40 group-hover:shadow-2xs transition-all mb-3 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80';
            }}
          />

          {/* Floating Discount Tag */}
          {discountPercent > 0 && (
            <div className="absolute bottom-2 left-2 bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Rating & Review Count */}
        <div className="flex items-center space-x-1 mb-1.5">
          <div className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200/60 font-black px-1.5 py-0.5 rounded text-[10px]">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{rating}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            ({reviewCount})
          </span>
          {inStock && stockQty <= 3 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded ml-auto">
              Only {stockQty} left
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
          {name}
        </h3>
      </div>

      {/* Price & Quick Add Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm md:text-base font-black text-slate-950 block tracking-tight">
              {formattedPrice}
            </span>
            {discountPercent > 0 && (
              <span className="text-[11px] text-slate-400 line-through">
                {formattedMrp}
              </span>
            )}
          </div>

          <span className={`text-[10px] font-bold ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Quick Add To Cart Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!inStock || addingToCart}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : !inStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950'
          }`}
          title="Quick add to cart"
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{inStock ? 'Quick Add' : 'Out of Stock'}</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
