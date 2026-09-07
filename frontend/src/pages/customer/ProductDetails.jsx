import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, Heart, ShieldCheck, Truck, ShieldAlert, Award, Star, 
  ChevronLeft, ChevronRight, X, CheckCircle, Package, Zap, ExternalLink, Box,
  ArrowLeftRight, CreditCard, Check, Plus
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import axiosInstance from '../../api/axiosInstance';
import productService from '../../services/productService';

import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProductCard from '../../components/product/ProductCard';
import { Skeleton } from '../../components/feedback/Skeleton';
import DeliveryChecker from '../../components/common/DeliveryChecker';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext) || {};
  const { user } = useContext(AuthContext) || {};
  const { isInWishlist, toggleWishlist } = useWishlist() || {};
  const { isInCompare, toggleCompare } = useCompare();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, averageRating: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const isWishlisted = product ? (isInWishlist ? isInWishlist(product._id) : false) : false;

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
  const [hoverRating, setHoverRating] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState({ canReview: false, existingReview: null, reason: '' });
  const [starFilter, setStarFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');
  const [loadingReviews, setLoadingReviews] = useState(false);

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

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product || !toggleWishlist) return;
    try {
      const res = await toggleWishlist(product._id);
      setReviewMsg({
        type: 'success',
        text: res?.message || (res?.action === 'added' ? 'Added to your wishlist.' : 'Removed from wishlist.'),
      });
      setTimeout(() => setReviewMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      setReviewMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error updating wishlist.',
      });
      setTimeout(() => setReviewMsg({ type: '', text: '' }), 3000);
    }
  };

  const fetchReviewsList = async (productId, star = starFilter, sort = sortFilter) => {
    if (!productId) return;
    setLoadingReviews(true);
    try {
      const params = {};
      if (star) params.star = star;
      if (sort) params.sort = sort;
      const rData = await productService.getProductReviews(productId, params);
      if (rData.success) {
        setReviewsData(rData);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const checkEligibility = async (productId) => {
    if (!user || !productId) {
      setReviewEligibility({ canReview: false, existingReview: null, reason: 'Please log in to submit a review.' });
      return;
    }
    try {
      const res = await productService.getReviewEligibility(productId);
      if (res.success) {
        setReviewEligibility({
          canReview: res.canReview,
          existingReview: res.existingReview || null,
          reason: res.message || '',
        });
        if (res.existingReview) {
          setNewRating(res.existingReview.rating || 5);
          setNewTitle(res.existingReview.title || '');
          setNewComment(res.existingReview.comment || '');
        }
      }
    } catch (e) {
      console.error('Error checking review eligibility:', e);
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

          // Fetch reviews & distribution
          fetchReviewsList(prod._id);

          // Check user review eligibility
          if (user) {
            checkEligibility(prod._id);
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
  }, [slug, user]);

  const handleFilterReviews = (star) => {
    setStarFilter(star);
    if (product?._id) {
      fetchReviewsList(product._id, star, sortFilter);
    }
  };

  const handleSortReviews = (sort) => {
    setSortFilter(sort);
    if (product?._id) {
      fetchReviewsList(product._id, starFilter, sort);
    }
  };

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
    if (!newComment.trim()) {
      setReviewMsg({ type: 'error', text: 'Please enter your review feedback.' });
      return;
    }

    setSubmittingReview(true);
    setReviewMsg({ type: '', text: '' });
    try {
      const res = await productService.submitReview({
        productId: product._id,
        rating: newRating,
        title: newTitle.trim(),
        comment: newComment.trim(),
      });

      if (res.success) {
        setReviewMsg({ type: 'success', text: res.message || 'Thank you! Your verified review was submitted.' });
        // Refresh eligibility and reviews list
        await checkEligibility(product._id);
        await fetchReviewsList(product._id, starFilter, sortFilter);
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Error submitting review.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingReview(true);
    try {
      const res = await productService.deleteReview(reviewId);
      if (res.success) {
        setReviewMsg({ type: 'success', text: 'Your review has been removed.' });
        setNewTitle('');
        setNewComment('');
        setNewRating(5);
        await checkEligibility(product._id);
        await fetchReviewsList(product._id, starFilter, sortFilter);
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Error deleting review.' });
    } finally {
      setDeletingReview(false);
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

            <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompare(product);
                }}
                className={`p-2 rounded-full shadow-sm transition-colors focus:outline-none ${
                  isInCompare(product?._id)
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white/90 hover:bg-white text-brand-gray-500 hover:text-amber-600'
                }`}
                title={isInCompare(product?._id) ? 'Remove from comparison' : 'Add to compare'}
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleWishlist();
                }}
                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm text-brand-gray-500 hover:text-red-600 transition-colors focus:outline-none"
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
              </button>
            </div>

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
              {(reviewsData.total > 0 || (product.ratings?.count > 0 && product.ratings?.average > 0)) ? (
                <span className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold">{Number(reviewsData.averageRating || product.ratings?.average || 0).toFixed(1)}</span>
                  <span className="text-amber-700">({reviewsData.total || product.ratings?.count || 0} reviews)</span>
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  No reviews yet
                </span>
              )}
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

            {/* EMI Options Widget */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-left">
              <div className="flex items-center space-x-2 font-black text-slate-900">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>No-Cost EMI Options Available</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Starting from <strong className="text-slate-900 font-bold">₹{Math.round(product.sellingPrice / 12).toLocaleString('en-IN')}/month</strong> for 12 months with No-Cost EMI on select major bank cards and UPI credit lines.
              </p>
            </div>

            {/* What's In The Box Section */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 text-left shadow-2xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                <Box className="w-4 h-4 text-amber-600" />
                <span>What's In The Box</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">1x {product.name}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1x High-Output OEM Power Adapter</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1x Braided USB-C Data Cable</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1x Official Manufacturer Warranty Card</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Delivery Availability Checker */}
          <DeliveryChecker />

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

      {/* 3. Product Overview & Specs Tabs */}
      <div className="space-y-8">
        <div className="border-b border-brand-gray-200">
          <h2 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight pb-2 border-b-2 border-brand-dark inline-block">
            Engineering Specifications & Overview
          </h2>
        </div>

        <div className="prose prose-xs max-w-none text-brand-gray-700 leading-relaxed text-xs">
          <p>{product.description}</p>
        </div>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="bg-brand-light p-6 rounded border border-brand-gray-200 space-y-4">
            <h2 className="text-xs font-black text-brand-gray-900 uppercase tracking-wider">
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
        <div className="space-y-6 pt-6 border-t border-brand-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-brand-gray-900 uppercase tracking-tight flex items-center space-x-2">
                <span>Verified Customer Reviews</span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {reviewsData.total} {reviewsData.total === 1 ? 'review' : 'reviews'}
                </span>
              </h2>
              <div className="flex items-center space-x-2 pt-1.5">
                {reviewsData.total > 0 ? (
                  <>
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(reviewsData.averageRating)
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-black text-brand-gray-900 font-mono">
                      {Number(reviewsData.averageRating || 0).toFixed(1)} out of 5
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      (based on real verified buyer ratings)
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    No verified customer ratings yet.
                  </span>
                )}
              </div>
            </div>

            {/* Star Filters */}
            {reviewsData.total > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => handleFilterReviews('')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                    !starFilter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFilterReviews(String(s))}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition-colors ${
                      starFilter === String(s)
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{s}★</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating Histogram & Feedback Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/80 p-6 rounded-xl border border-slate-200">
            {/* Histogram Column */}
            <div className="lg:col-span-5 space-y-2.5 text-xs justify-center flex flex-col">
              <span className="font-bold text-slate-900 block text-[13px]">Rating Breakdown</span>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsData.distribution?.[stars] || 0;
                const pct = reviewsData.total > 0 ? Math.round((count / reviewsData.total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center space-x-3">
                    <button
                      onClick={() => handleFilterReviews(String(stars))}
                      className="w-12 font-bold text-slate-700 text-left hover:text-amber-600 transition-colors"
                    >
                      {stars} Star
                    </button>
                    <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-14 text-right font-mono text-slate-500 text-[10px] font-semibold">{pct}% ({count})</span>
                  </div>
                );
              })}
            </div>

            {/* Leave a Review Form Column */}
            <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
              {!user ? (
                <div className="text-center py-6 space-y-3">
                  <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="font-bold text-slate-900">Have you purchased this product?</p>
                  <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                    Sign in to check your verified purchase status and submit your authentic hardware feedback.
                  </p>
                  <Link to="/login">
                    <Button size="sm" variant="primary" className="text-xs uppercase font-bold bg-amber-500 hover:bg-amber-600 text-slate-950">
                      Sign In to Review
                    </Button>
                  </Link>
                </div>
              ) : reviewEligibility.canReview ? (
                <form onSubmit={submitReview} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-[13px] uppercase tracking-tight flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{reviewEligibility.existingReview ? 'Update Your Verified Review' : 'Write a Verified Review'}</span>
                    </span>
                    {reviewEligibility.existingReview && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Active Review Found
                      </span>
                    )}
                  </div>

                  {/* Interactive Star Selection */}
                  <div className="space-y-1">
                    <span className="text-slate-600 font-semibold block text-[11px]">Your Rating (1 to 5 Stars):</span>
                    <div className="flex items-center space-x-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setNewRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= (hoverRating || newRating)
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-bold text-slate-800 ml-2 font-mono text-[11px]">
                        {newRating === 5 ? '5 ★ - Excellent' :
                         newRating === 4 ? '4 ★ - Very Good' :
                         newRating === 3 ? '3 ★ - Average' :
                         newRating === 2 ? '2 ★ - Poor' : '1 ★ - Terrible'}
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Review headline (e.g. Exceptional thermals and gaming performance)"
                    value={newTitle}
                    maxLength={100}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />

                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    placeholder="Describe your genuine hands-on experience with this product..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" type="submit" disabled={submittingReview} className="text-xs uppercase font-bold bg-amber-500 hover:bg-amber-600 text-slate-950">
                        {submittingReview ? 'Submitting...' : reviewEligibility.existingReview ? 'Update Review' : 'Submit Review'}
                      </Button>
                      {reviewEligibility.existingReview && (
                        <button
                          type="button"
                          disabled={deletingReview}
                          onClick={() => handleDeleteReview(reviewEligibility.existingReview._id)}
                          className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 font-bold transition-colors"
                        >
                          {deletingReview ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">Verified by KAIA Order System</span>
                  </div>
                </form>
              ) : (
                <div className="py-4 space-y-2 text-slate-600">
                  <div className="flex items-start space-x-2">
                    <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[12px]">Verified Buyer Policy</span>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {reviewEligibility.reason || 'Reviews on KAIA Technologies are reserved for verified customers with delivered orders. Once your order is delivered, you can submit your review here.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List Toolbar & Content */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700">
                {reviewsData.reviews?.length || 0} displayed {starFilter ? `(${starFilter} Star filtered)` : ''}
              </span>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortFilter}
                  onChange={(e) => handleSortReviews(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
                >
                  <option value="newest">Most Recent</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {loadingReviews ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading authentic reviews...
              </div>
            ) : reviewsData.reviews?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reviewsData.reviews.map((r) => {
                  const isOwn = user && (r.user?._id === user._id || r.user === user._id);
                  return (
                    <div key={r._id} className="py-4 space-y-2 text-xs text-left">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                            {r.user?.name?.charAt(0) || r.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">
                                {r.user?.name || r.name || 'Verified Buyer'}
                              </span>
                              {isOwn && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                              {r.isVerifiedPurchase && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                  ✓ Verified Purchase
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-amber-500">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (r.rating || 5)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 font-mono">{r.rating}/5</span>
                      </div>

                      {r.title && <p className="font-bold text-slate-900 text-[13px]">{r.title}</p>}
                      <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">No reviews found</p>
                <p className="text-[11px]">
                  {starFilter
                    ? `No ${starFilter}-star reviews found for this product.`
                    : 'Be the first verified customer to share your thoughts!'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Frequently Bought Together Bundle */}
      {relatedProducts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-left shadow-xs">
          <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span>Frequently Bought Together</span>
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center space-x-3 overflow-x-auto py-2">
              <div className="w-20 h-20 bg-slate-50 border rounded-lg p-1.5 flex items-center justify-center shrink-0">
                <img src={images[0]?.url || images[0]} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
              <span className="text-slate-400 font-black text-lg">+</span>
              <div className="w-20 h-20 bg-slate-50 border rounded-lg p-1.5 flex items-center justify-center shrink-0">
                <img src={relatedProducts[0]?.images?.[0]?.url || relatedProducts[0]?.images?.[0] || 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500'} alt={relatedProducts[0]?.name} className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-xs text-slate-700">
                <strong>Bundle Includes:</strong> {product.name} <span className="text-slate-400">&</span> {relatedProducts[0]?.name}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-bold text-slate-500">Combined Price:</span>
                <span className="text-lg font-black text-slate-950">
                  ₹{(product.sellingPrice + (relatedProducts[0]?.sellingPrice || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                addToCart(product, 1);
                if (relatedProducts[0]) addToCart(relatedProducts[0], 1);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-5 rounded-lg shadow-sm transition-colors shrink-0"
            >
              Add Both to Cart
            </button>
          </div>
        </div>
      )}

      {/* 5. Related Products Grid */}
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center justify-center"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors shadow-sm"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main Zoomed Image */}
            <div className="w-full flex items-center justify-center p-4 relative min-h-[350px] max-h-[65vh]">
              <img
                src={images[activeImage]?.url || (typeof images[activeImage] === 'string' ? images[activeImage] : '')}
                alt={product.name}
                className="max-h-[60vh] max-w-full object-contain mx-auto transition-transform hover:scale-105 duration-200 cursor-zoom-in"
              />

              {/* Prev Button */}
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-all shadow-md"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev + 1) % images.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-all shadow-md"
                  title="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Thumbnail Navigation Bar in Modal */}
            {images.length > 1 && (
              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100 overflow-x-auto max-w-full">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-14 rounded-lg border p-1 shrink-0 transition-all ${
                      activeImage === i
                        ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url || (typeof img === 'string' ? img : '')}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            <span className="text-[11px] font-mono text-slate-500 mt-2 font-bold">
              Image {activeImage + 1} of {images.length}
            </span>
          </div>
        </div>
      )}

    </Container>
  );
};

export default ProductDetails;
