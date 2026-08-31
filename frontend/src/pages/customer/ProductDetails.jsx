import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, Heart, ShieldCheck, Truck, ShieldAlert, Award, Star, 
  ChevronLeft, ChevronRight, X, CheckCircle, Package, Zap, ExternalLink, Box 
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import productService from '../../services/productService';

import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProductCard from '../../components/product/ProductCard';
import { Skeleton } from '../../components/feedback/Skeleton';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, averageRating: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Lightbox Zoom Modal
  const [showLightbox, setShowLightbox] = useState(false);

  // Variant selections
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');

  // Delivery checker
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Registry hook for recently viewed items
  const registerRecentlyViewed = (prod) => {
    try {
      const history = localStorage.getItem('kaia_recently_viewed');
      let parsed = history ? JSON.parse(history) : [];
      if (!Array.isArray(parsed)) parsed = [];

      parsed = parsed.filter((item) => item._id !== prod._id);
      parsed.unshift({
        _id: prod._id,
        name: prod.name,
        slug: prod.slug,
        sellingPrice: prod.sellingPrice,
        mrp: prod.mrp,
        images: prod.images,
        brand: prod.brand,
        stock: prod.stock,
      });

      localStorage.setItem('kaia_recently_viewed', JSON.stringify(parsed.slice(0, 10)));
    } catch (err) {
      console.error('Error logging recently viewed:', err);
    }
  };

  // Check wishlist status
  const checkWishlistStatus = async (prodId) => {
    if (!user) return;
    try {
      const res = await axiosInstance.get('/account/wishlist');
      if (res.data?.success) {
        const found = res.data.wishlist.some((item) => item.product?._id === prodId || item.product === prodId);
        setIsWishlisted(found);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isWishlisted) {
        await axiosInstance.delete(`/account/wishlist/${product._id}`);
        setIsWishlisted(false);
      } else {
        await axiosInstance.post('/account/wishlist', { productId: product._id });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        if (res.success) {
          const prod = res.product;
          setProduct(prod);
          registerRecentlyViewed(prod);
          checkWishlistStatus(prod._id);

          // Fetch reviews & distribution
          try {
            const rData = await productService.getProductReviews(prod._id);
            if (rData.success) {
              setReviewsData(rData);
            }
          } catch (e) {
            console.error('Error fetching reviews:', e);
          }

          // Fetch related products
          try {
            const relRes = await productService.getRelatedProducts(slug);
            if (relRes.success) {
              setRelatedProducts(relRes.related || []);
            }
          } catch (e) {
            console.error('Error fetching related products:', e);
          }

          // Initialize variants
          if (prod.specifications?.RAM) setSelectedRam(prod.specifications.RAM);
          if (prod.specifications?.Storage) setSelectedStorage(prod.specifications.Storage);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const handleCheckDelivery = async (e) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setDeliveryStatus({ type: 'error', text: 'Enter a valid 6-digit Indian PIN code.' });
      return;
    }
    setCheckingPincode(true);
    try {
      const res = await productService.checkPincodeServiceability(pincode.trim());
      if (res.serviceable) {
        setDeliveryStatus({
          type: 'success',
          text: `Express Delivery Available. Estimated in ${res.estimatedDays}. ${res.codAvailable ? 'Cash on Delivery eligible.' : ''}`,
        });
      } else {
        setDeliveryStatus({
          type: 'error',
          text: res.message || 'Delivery is currently unavailable to this PIN code.',
        });
      }
    } catch (err) {
      setDeliveryStatus({ type: 'error', text: 'Error verifying PIN code.' });
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, { RAM: selectedRam, Storage: selectedStorage });
    setReviewMsg({ type: 'success', text: `Added ${product.name} to cart!` });
    setTimeout(() => setReviewMsg({ type: '', text: '' }), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity, { RAM: selectedRam, Storage: selectedStorage });
    navigate('/cart');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    setReviewMsg({ type: '', text: '' });
    try {
      const res = await axiosInstance.post('/account/reviews', {
        productId: product._id,
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });

      if (res.data.success) {
        setReviewMsg({ type: 'success', text: 'Thank you! Your verified review was posted.' });
        setNewTitle('');
        setNewComment('');
        // Reload reviews distribution
        const rData = await productService.getProductReviews(product._id);
        if (rData.success) setReviewsData(rData);
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Error submitting review.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-16 animate-pulse space-y-8 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-brand-gray-400 mx-auto" />
        <h3 className="text-xl font-bold text-brand-gray-800">Product not found.</h3>
        <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
          This hardware model is unavailable or has been discontinued. Explore our active catalog.
        </p>
        <Link to="/products">
          <Button size="sm" className="text-xs uppercase font-bold">
            Browse All Products
          </Button>
        </Link>
      </div>
    );
  }

  const availableStock = product.availableQuantity ?? (product.stock?.quantity - (product.stock?.reservedQuantity || 0)) ?? 0;
  const isOutOfStock = availableStock <= 0;
  const discountPct = product.discountPercentage || (product.mrp && product.mrp > product.sellingPrice ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0);
  const images = product.images && product.images.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800' }];

  return (
    <Container className="py-8 text-left space-y-12 select-none font-sans">
      
      {/* 1. Breadcrumbs */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800">Home</Link>
        <span>&gt;</span>
        <Link to="/products" className="hover:text-brand-gray-800">Catalog</Link>
        <span>&gt;</span>
        {product.category && (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-brand-gray-800 capitalize">
              {product.category.name}
            </Link>
            <span>&gt;</span>
          </>
        )}
        <span className="text-brand-gray-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {reviewMsg.text && (
        <div className={`p-3 rounded text-xs font-bold ${reviewMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {reviewMsg.text}
        </div>
      )}

      {/* 2. Primary 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Thumbnails + Main View */}
        <div className="space-y-4">
          <div
            onClick={() => setShowLightbox(true)}
            className="aspect-square bg-[#F8FAFC] border border-slate-200/80 p-8 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm cursor-zoom-in group"
          >
            {discountPct > 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-tight shadow-sm">
                {discountPct}% OFF
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWishlist();
              }}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm text-brand-gray-500 hover:text-red-600 transition-colors focus:outline-none"
              title="Save to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
            </button>

            <img
              src={images[activeImage]?.url || images[activeImage]}
              alt={product.name}
              className="w-full h-full max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
            />
            <span className="absolute bottom-3 right-3 bg-slate-900/10 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
              Click to Zoom
            </span>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-1.5 scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-18 h-18 bg-[#F8FAFC] border rounded-xl p-2 flex items-center justify-center shrink-0 hover:border-amber-500 transition-colors ${
                    activeImage === i ? 'border-amber-500 ring-2 ring-amber-500/20 bg-white' : 'border-slate-200'
                  }`}
                >
                  <img src={img.url || img} alt="" className="w-full h-full object-contain max-h-full max-w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info, Pricing, Pincode & Action Strip */}
        <div className="space-y-6">
          <div className="space-y-2 border-b border-brand-gray-200 pb-4">
            {product.brand && (
              <Link
                to={`/brand/${product.brand.slug}`}
                className="text-xs font-black tracking-widest text-brand-accent uppercase hover:underline inline-flex items-center space-x-1"
              >
                <span>{product.brand.name}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            
            <h1 className="text-2xl md:text-3xl font-black text-brand-gray-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-gray-500 pt-1 font-semibold">
              <span className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-bold">{reviewsData.averageRating || product.ratings?.average || 4.5}</span>
                <span className="text-amber-700">({reviewsData.total || product.ratings?.count || 0} reviews)</span>
              </span>
              <span>•</span>
              <span className="font-mono">SKU: <strong>{product.SKU}</strong></span>
              <span>•</span>
              <span className="font-mono">Model: <strong>{product.modelNumber}</strong></span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-brand-light border border-brand-gray-200 rounded-sm space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-brand-gray-950 font-mono">
                ₹{product.sellingPrice?.toLocaleString('en-IN')}
              </span>
              {product.mrp && product.mrp > product.sellingPrice && (
                <>
                  <span className="text-sm font-semibold text-brand-gray-400 line-through font-mono">
                    ₹{product.mrp?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Save ₹{(product.mrp - product.sellingPrice).toLocaleString('en-IN')} ({discountPct}% OFF)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-brand-gray-500">
              Inclusive of all GST taxes ({product.gstRate || 18}%). Free Express Shipping across India.
            </p>
          </div>

          {/* Stock Scarcity Status */}
          <div className="flex items-center space-x-2 text-xs">
            {isOutOfStock ? (
              <span className="font-black text-red-600 uppercase">Currently Out of Stock</span>
            ) : availableStock <= 5 ? (
              <span className="font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                ⚡ Only {availableStock} units left in warehouse — order soon!
              </span>
            ) : (
              <span className="font-bold text-emerald-700 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>In Stock & Ready for Immediate Dispatch</span>
              </span>
            )}
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-4 pt-2 border-t border-brand-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-brand-gray-700">Quantity:</span>
              <div className="flex items-center border border-brand-gray-300 rounded">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-2.5 py-1 text-brand-gray-600 hover:bg-brand-gray-100 text-xs font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-mono font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(availableStock || 10, q + 1))}
                  className="px-2.5 py-1 text-brand-gray-600 hover:bg-brand-gray-100 text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="md"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                variant="outline"
                className="text-xs uppercase font-black flex items-center justify-center space-x-2 py-3"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </Button>

              <Button
                size="md"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="text-xs uppercase font-black flex items-center justify-center space-x-2 py-3"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </Button>
            </div>
          </div>

          {/* Pincode Serviceability Checker */}
          <div className="p-4 border border-brand-gray-200 rounded-sm bg-white space-y-3">
            <span className="text-xs font-black uppercase text-brand-gray-900 flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-brand-accent" />
              <span>Check Delivery & Serviceability</span>
            </span>

            <form onSubmit={handleCheckDelivery} className="flex space-x-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 p-2 border rounded text-xs font-mono"
              />
              <Button size="sm" type="submit" disabled={checkingPincode} className="text-xs uppercase font-bold">
                {checkingPincode ? 'Checking...' : 'Check'}
              </Button>
            </form>

            {deliveryStatus && (
              <p className={`text-xs font-semibold ${deliveryStatus.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
                {deliveryStatus.text}
              </p>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-brand-gray-600">
            <div className="p-2 bg-brand-light rounded border border-brand-gray-200">
              <ShieldCheck className="w-4 h-4 mx-auto text-brand-accent mb-1" />
              <span className="font-bold block">100% Genuine</span>
              <span>Official Brand Stock</span>
            </div>
            <div className="p-2 bg-brand-light rounded border border-brand-gray-200">
              <Award className="w-4 h-4 mx-auto text-brand-accent mb-1" />
              <span className="font-bold block">{product.warranty || '1 Year Warranty'}</span>
              <span>Manufacturer Covered</span>
            </div>
            <div className="p-2 bg-brand-light rounded border border-brand-gray-200">
              <Package className="w-4 h-4 mx-auto text-brand-accent mb-1" />
              <span className="font-bold block">7 Days Return</span>
              <span>Transit Replacement</span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Detailed Specifications & Description Tabs */}
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-8 space-y-8">
        
        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight border-b border-brand-gray-200 pb-2">
            Product Overview & Description
          </h2>
          <div className="text-xs text-brand-gray-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>

        {/* Dynamic Specifications Table */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight border-b border-brand-gray-200 pb-2">
              Technical Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs divide-y divide-brand-gray-100">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="py-2 flex justify-between">
                  <span className="font-bold text-brand-gray-600">{key}</span>
                  <span className="font-medium text-brand-gray-900 text-right">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews & Rating Distribution */}
        <div className="space-y-6 pt-4 border-t border-brand-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight">
                Verified Customer Reviews ({reviewsData.total})
              </h2>
              <div className="flex items-center space-x-2 pt-1">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-black text-brand-gray-900 font-mono">
                  {reviewsData.averageRating || 4.5} out of 5
                </span>
              </div>
            </div>
          </div>

          {/* Rating Histogram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-brand-light p-6 rounded border border-brand-gray-200">
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsData.distribution?.[stars] || 0;
                const pct = reviewsData.total > 0 ? Math.round((count / reviewsData.total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center space-x-3">
                    <span className="w-10 font-bold text-brand-gray-700">{stars} Star</span>
                    <div className="flex-1 bg-brand-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right font-mono text-brand-gray-500 text-[10px]">{pct}% ({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Leave a Review Form */}
            <form onSubmit={submitReview} className="space-y-3 text-xs">
              <span className="font-bold text-brand-gray-900 block">Write a Verified Review</span>
              <div className="flex items-center space-x-2">
                <span className="text-brand-gray-600">Your Rating:</span>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="p-1 border rounded font-bold"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Review headline (e.g. Blazing fast performance)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2 border rounded text-xs"
              />

              <textarea
                rows={3}
                required
                placeholder="Share your detailed experience with this hardware product..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2 border rounded text-xs"
              />

              <Button size="sm" type="submit" disabled={submittingReview} className="text-xs uppercase font-bold">
                {submittingReview ? 'Posting...' : 'Submit Review'}
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="divide-y divide-brand-gray-100">
            {reviewsData.reviews?.map((r) => (
              <div key={r._id} className="py-4 space-y-1.5 text-xs text-left">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold text-[10px]">
                      {r.user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="font-bold text-brand-gray-900">{r.user?.name || r.name || 'Verified Buyer'}</span>
                    {r.isVerifiedPurchase && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brand-gray-400 font-mono">
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex text-amber-500 py-0.5">
                  {[...Array(r.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {r.title && <p className="font-bold text-brand-gray-900">{r.title}</p>}
                <p className="text-brand-gray-600 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
            <h3 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight">
              Related Hardware Recommendations
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Lightbox Modal */}
      {showLightbox && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white p-6 rounded shadow-2xl">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-3 right-3 p-1.5 bg-brand-gray-100 hover:bg-brand-gray-200 rounded-full"
            >
              <X className="w-5 h-5 text-brand-gray-700" />
            </button>
            <img
              src={images[activeImage]?.url || images[activeImage]}
              alt={product.name}
              className="max-h-[75vh] max-w-full object-contain mx-auto"
            />
          </div>
        </div>
      )}

    </Container>
  );
};

export default ProductDetails;
