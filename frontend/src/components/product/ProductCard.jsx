import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import Image from '../ui/Image';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { CartContext } from '../../context/CartContext';

const ProductCard = ({
  product,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
  className = '',
  ...props
}) => {
  const { addToCart } = useContext(CartContext);

  if (!product) return null;

  const {
    _id,
    name,
    slug,
    brand,
    sellingPrice,
    mrp,
    images = [],
    ratings = { average: 4.5, count: 12 },
    stock = { quantity: 1, reservedQuantity: 0 },
  } = product;

  const brandName = brand?.name || 'Warehouse Direct';
  const imageUrl = images[0]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=550&auto=format&fit=crop&q=60';
  
  const discount = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const inStock = (stock.quantity - stock.reservedQuantity) > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, {});
  };

  return (
    <div
      className={`bg-white border border-brand-gray-200 rounded-sm overflow-hidden shadow-premium hover:border-brand-accent transition-all duration-300 group flex flex-col justify-between relative ${className}`}
      {...props}
    >
      {/* Top badges and Wishlist Button */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col space-y-1.5 items-start">
        {discount > 0 && (
          <Badge variant="deal">
            Save {discount}%
          </Badge>
        )}
        {!inStock && (
          <Badge variant="out_of_stock">
            Sold Out
          </Badge>
        )}
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          if (onToggleWishlist) onToggleWishlist(_id);
        }}
        className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-white/85 hover:bg-white rounded-full border border-brand-gray-200 text-brand-gray-400 hover:text-brand-accent transition-colors shadow-sm focus:outline-none"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-brand-accent text-brand-accent' : ''}`} />
      </button>

      {/* Product Image Link */}
      <Link to={`/product/${slug}`} className="block overflow-hidden relative">
        <Image
          src={imageUrl}
          alt={name}
          aspectRatio="aspect-video"
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Details Box */}
      <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] text-brand-gray-450 font-bold uppercase tracking-wider">{brandName}</p>
          <Link
            to={`/product/${slug}`}
            className="font-bold text-xs text-brand-gray-900 line-clamp-2 hover:text-brand-accent transition-colors leading-snug"
          >
            {name}
          </Link>
          
          <div className="flex items-center space-x-1.5 text-[10px] text-brand-gray-500 pt-0.5">
            <div className="flex text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-brand-gray-800">{ratings.average || 4.5}</span>
            <span>({ratings.count || 0})</span>
          </div>
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="space-y-3 pt-1 border-t border-brand-gray-100">
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-extrabold text-brand-gray-950">₹{sellingPrice.toLocaleString()}</span>
            {mrp > sellingPrice && (
              <span className="text-[10px] text-brand-gray-400 line-through">₹{mrp.toLocaleString()}</span>
            )}
          </div>

          <div className="flex space-x-2">
            {inStock ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                className="w-full text-[10px] font-bold tracking-wider uppercase flex items-center justify-center space-x-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="w-full text-[10px] font-bold tracking-wider uppercase"
              >
                Out of Stock
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
