import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ShieldCheck, Truck, ShieldAlert, Award, Star, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

// UI foundations
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import { Modal } from '../../components/common/Modal';
import ProductGrid from '../../components/product/ProductGrid';
import { Skeleton } from '../../components/feedback/Skeleton';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Lightbox Zoom Modal
  const [showLightbox, setShowLightbox] = useState(false);

  // Variant selections (Configurable default states)
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [variantPriceOffset, setVariantPriceOffset] = useState(0);

  // Delivery checker
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  // Registry hook for recently viewed items
  const registerRecentlyViewed = (prod) => {
    try {
      const history = localStorage.getItem('kaia_recently_viewed');
      let parsed = history ? JSON.parse(history) : [];
      if (!Array.isArray(parsed)) parsed = [];

      // Remove existing to place newest on top
      parsed = parsed.filter(item => item._id !== prod._id);
      parsed.unshift({
        _id: prod._id,
        name: prod.name,
        slug: prod.slug,
        sellingPrice: prod.sellingPrice,
        mrp: prod.mrp,
        images: prod.images,
        brand: prod.brand,
        stock: prod.stock
      });

      // Keep only top 10 items
      localStorage.setItem('kaia_recently_viewed', JSON.stringify(parsed.slice(0, 10)));
    } catch (err) {
      console.error('Error logging recently viewed:', err);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/products/${slug}`);
        if (res.data.success) {
          const prod = res.data.product;
          setProduct(prod);

          // Ingest to localstorage recently viewed
          registerRecentlyViewed(prod);

          // Fetch reviews
          const reviewRes = await axiosInstance.get(`/reviews/${prod._id}`);
          if (reviewRes.data.success) setReviews(reviewRes.data.reviews);

          // Fetch related products (same category)
          const relRes = await axiosInstance.get(`/products?category=${prod.category?.slug || ''}&limit=4`);
          if (relRes.data.success) {
            setRelatedProducts(relRes.data.products.filter(p => p._id !== prod._id));
          }

          // Initialize variants if available in specs
          if (prod.specifications?.RAM) {
            setSelectedRam(prod.specifications.RAM);
          }
          if (prod.specifications?.Storage) {
            setSelectedStorage(prod.specifications.Storage);
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const handlePriceOffset = (ram) => {
    setSelectedRam(ram);
    if (ram === '16GB') setVariantPriceOffset(8000);
    else if (ram === '32GB') setVariantPriceOffset(16000);
    else setVariantPriceOffset(0);
  };

  const handleCheckDelivery = (e) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setDeliveryStatus({ type: 'error', text: 'Enter a valid 6-digit PIN code.' });
      return;
    }
    // Sandbox estimates
    const speed = Number(pincode) % 2 === 0 ? 'Fast Express: 2 Business Days' : 'Standard Delivery: 4 Business Days';
    setDeliveryStatus({
      type: 'success',
      text: `Delivery Active. Estimate: ${speed}. Cash on delivery available.`,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = product.sellingPrice + variantPriceOffset;
    addToCart(
      { ...product, sellingPrice: finalPrice },
      quantity,
      { RAM: selectedRam, Storage: selectedStorage }
    );
    setReviewMsg({ type: 'success', text: `${product.name} added to cart!` });
    setTimeout(() => setReviewMsg({ type: '', text: '' }), 3000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const finalPrice = product.sellingPrice + variantPriceOffset;
    addToCart(
      { ...product, sellingPrice: finalPrice },
      quantity,
      { RAM: selectedRam, Storage: selectedStorage }
    );
    navigate('/cart');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axiosInstance.post('/reviews', {
        productId: product._id,
        rating: newRating,
        comment: newComment,
      });

      if (res.data.success) {
        setReviewMsg({ type: 'success', text: res.data.message });
        setNewComment('');
        // Reload reviews
        const reviewRes = await axiosInstance.get(`/reviews/${product._id}`);
        if (reviewRes.data.success) setReviews(reviewRes.data.reviews);
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Error posting review.' });
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
          This technology may have moved or is no longer available. Explore our brand partner listings.
        </p>
        <Link to="/products" className="inline-block bg-brand-dark text-white font-semibold py-2.5 px-6 rounded-sm text-xs">
          Explore Products
        </Link>
      </div>
    );
  }

  const availableStock = product.stock.quantity - product.stock.reservedQuantity;
  const isOutOfStock = availableStock <= 0;
  const finalPrice = product.sellingPrice + variantPriceOffset;

  return (
    <Container className="py-10 text-left space-y-12 select-none">
      
      {/* 1. Breadcrumbs */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800">Home</Link>
        <span>&gt;</span>
        <Link to="/products" className="hover:text-brand-gray-800">Products</Link>
        <span>&gt;</span>
        <span className="capitalize">{product.category?.name}</span>
        <span>&gt;</span>
        <span className="text-brand-gray-850 font-bold">{product.brand?.name}</span>
      </nav>

      {/* 2. Primary 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Thumbnails + Main View */}
        <div className="space-y-4">
          <div
            onClick={() => setShowLightbox(true)}
            className="aspect-square bg-white border border-brand-gray-250 p-6 rounded-sm flex items-center justify-center relative overflow-hidden shadow-premium cursor-zoom-in group"
          >
            <img
              src={product.images[activeImage]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'}
              alt={product.name}
              className="object-contain max-h-full max-w-full group-hover:scale-102 transition-transform"
            />
            <span className="absolute bottom-3 right-3 bg-brand-dark/5 text-brand-gray-600 text-[10px] font-bold px-2 py-1 rounded">
              Click to Zoom
            </span>
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-1.5 scrollbar-thin">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 bg-white border rounded-sm p-2 flex items-center justify-center shrink-0 hover:border-brand-accent transition-colors ${
                    activeImage === i ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-brand-gray-250'
                  }`}
                >
                  <img src={img.url} alt="" className="object-contain max-h-full max-w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Info Panel */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-brand-accent uppercase block">
              {product.brand?.name} Hub
            </span>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-gray-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center space-x-4 text-xs text-brand-gray-500 pt-1 font-semibold">
              <span className="flex items-center space-x-1">
                <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                <span className="text-brand-gray-800">{product.ratings?.average || 4.5}</span>
                <span>({reviews.length} reviews)</span>
              </span>
              <span>•</span>
              <span>Model: {product.modelNumber}</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-brand-gray-50 border border-brand-gray-250 rounded-sm space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-brand-gray-950">₹{finalPrice.toLocaleString()}</span>
              {product.mrp > product.sellingPrice && (
                <>
                  <span className="text-sm text-brand-gray-400 line-through">MRP: ₹{(product.mrp + variantPriceOffset).toLocaleString()}</span>
                  <span className="text-xs bg-brand-accent text-white font-bold px-2 py-0.5 rounded uppercase">
                    Save {Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)}%
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] text-brand-gray-450 leading-relaxed font-bold">Inclusive of platform standard tax components.</p>
          </div>

          {/* Stock Status Badge */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-bold text-brand-gray-700">Warehouse Inventory:</span>
            {!isOutOfStock ? (
              <StatusBadge status="Delivered" className="bg-green-50 text-green-700 border-green-200">
                In Stock ({availableStock} units)
              </StatusBadge>
            ) : (
              <StatusBadge status="Cancelled" className="bg-red-50 text-red-700 border-red-200">
                Out of Stock
              </StatusBadge>
            )}
          </div>

          {/* Custom Variants Selector */}
          {product.category?.slug === 'laptops' && (
            <div className="space-y-3 pb-4 border-b border-brand-gray-200">
              <h4 className="font-bold text-[11px] text-brand-gray-900 uppercase tracking-wider">RAM Configuration:</h4>
              <div className="flex space-x-3">
                {['8GB', '16GB', '32GB'].map((ram) => (
                  <button
                    key={ram}
                    onClick={() => handlePriceOffset(ram)}
                    className={`text-xs px-4 py-2 border rounded-sm font-semibold transition-all ${
                      selectedRam === ram
                        ? 'border-brand-accent bg-brand-accent/5 text-brand-accent font-extrabold'
                        : 'border-brand-gray-250 text-brand-gray-600 hover:border-brand-gray-400'
                    }`}
                  >
                    {ram} {ram !== '8GB' ? `(+ ₹${(ram === '16GB' ? 8000 : 16000).toLocaleString()})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline alert messages */}
          {reviewMsg.text && (
            <div className={`p-3 rounded text-xs font-semibold ${
              reviewMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {reviewMsg.text}
            </div>
          )}

          {/* CTAs */}
          {!isOutOfStock ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold text-brand-gray-700 uppercase">Quantity:</span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-white border border-brand-gray-200 p-2 rounded-sm text-xs cursor-pointer focus:ring-0"
                >
                  {[...Array(Math.min(5, availableStock)).keys()].map((n) => (
                    <option key={n + 1} value={n + 1}>{n + 1}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handleAddToCart}
                  className="flex-1 border-brand-dark hover:bg-brand-gray-50 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Unified Cart</span>
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleBuyNow}
                  className="flex-1 bg-brand-accent hover:bg-brand-accentHover border-none py-3.5 text-xs font-bold uppercase tracking-wider"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-brand-gray-500 font-semibold italic">This product is currently out of stock. You can subscribe to inventory notifications below.</p>
              <Button
                variant="secondary"
                disabled
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider"
              >
                Notify Me When Restocked
              </Button>
            </div>
          )}

          {/* 3. Delivery Checker */}
          <div className="border-t pt-6 space-y-3">
            <h4 className="font-bold text-[11px] text-brand-gray-900 uppercase tracking-wider">Logistics Availability Check:</h4>
            <form onSubmit={handleCheckDelivery} className="flex space-x-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs placeholder:text-brand-gray-400"
              />
              <Button type="submit" variant="secondary" size="sm" className="text-xs">Check PIN</Button>
            </form>
            {deliveryStatus && (
              <p className={`text-[10px] font-semibold ${deliveryStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {deliveryStatus.text}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* 4. Product description and technical specifications */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t pt-12 items-start">
        {/* Overview Description */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-extrabold text-brand-gray-950 uppercase tracking-tight">Product Overview</h2>
          <p className="text-xs text-brand-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>

        {/* Specifications Table */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-extrabold text-brand-gray-955 uppercase tracking-tight">Technical Specifications</h2>
          <div className="border border-brand-gray-200 rounded-sm overflow-hidden shadow-premium">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <tbody className="bg-white divide-y divide-brand-gray-200">
                {Object.entries(product.specifications || {}).map(([key, val]) => (
                  <tr key={key}>
                    <td className="px-6 py-3 font-semibold text-brand-gray-700 bg-brand-gray-50 border-r w-1/3 uppercase tracking-wider">{key}</td>
                    <td className="px-6 py-3 text-brand-gray-600 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Rating distribution review metrics */}
      <section className="border-t pt-12 space-y-8">
        <h2 className="text-lg font-extrabold text-brand-gray-950 uppercase tracking-tight">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Review distribution left column */}
          <div className="lg:col-span-4 bg-white border p-6 rounded-sm shadow-premium space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase">Fulfill feedback</h3>
            {user ? (
              <form onSubmit={submitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-brand-gray-650">Rating stars:</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full bg-brand-light border p-2 rounded text-xs"
                  >
                    <option value={5}>5 ★ Excellent</option>
                    <option value={4}>4 ★ Good</option>
                    <option value={3}>3 ★ Average</option>
                    <option value={2}>2 ★ Poor</option>
                    <option value={1}>1 ★ Terrible</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="font-bold text-brand-gray-650">Comments:</label>
                  <textarea
                    rows={4}
                    placeholder="State your verified purchase feedback..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-brand-light border p-2 rounded text-xs"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full text-xs font-bold">Submit Review</Button>
              </form>
            ) : (
              <p className="text-[10px] text-brand-gray-450 italic">
                Please <Link to="/login" className="text-brand-accent font-semibold hover:underline">sign in</Link> to post product feedback.
              </p>
            )}
          </div>

          {/* List of reviews */}
          <div className="lg:col-span-8 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-brand-gray-500 italic py-6">No customer reviews recorded yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                {reviews.map((r) => (
                  <div key={r._id} className="bg-white border border-brand-gray-200 p-5 rounded-sm shadow-premium space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-brand-gray-800">{r.name}</span>
                      <span className="text-brand-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-brand-gray-600 leading-relaxed font-semibold">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t pt-12 space-y-8">
          <h2 className="text-lg font-extrabold text-brand-gray-950 uppercase tracking-tight">Complete Your Setup</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}

      {/* 7. Image Lightbox Zoom Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6">
          {/* Lightbox Header */}
          <div className="flex justify-between items-center text-white text-xs select-none">
            <span className="font-semibold">{product.name} ({activeImage + 1} of {product.images.length})</span>
            <button
              onClick={() => setShowLightbox(false)}
              className="p-1 text-white hover:text-brand-gray-400 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Main viewer */}
          <div className="flex-1 flex justify-between items-center relative">
            <button
              disabled={activeImage === 0}
              onClick={() => setActiveImage(activeImage - 1)}
              className="p-2 text-white hover:text-brand-gray-400 focus:outline-none disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <div className="w-full max-w-3xl h-full flex items-center justify-center p-4">
              <img
                src={product.images[activeImage]?.url}
                alt=""
                className="object-contain max-h-[80vh] max-w-full"
              />
            </div>

            <button
              disabled={activeImage === product.images.length - 1}
              onClick={() => setActiveImage(activeImage + 1)}
              className="p-2 text-white hover:text-brand-gray-400 focus:outline-none disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </div>

          {/* Empty bottom spacing for alignment */}
          <div />
        </div>
      )}

    </Container>
  );
};

export default ProductDetails;
