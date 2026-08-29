import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Laptop, Star, Eye, ShoppingCart } from 'lucide-react';
import productService from '../../services/productService';
import { CartContext } from '../../context/CartContext';

// UI components
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Modal } from '../../components/common/Modal';
import Drawer from '../../components/common/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { ProductSkeleton } from '../../components/feedback/Skeleton';
import Image from '../../components/ui/Image';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useContext(CartContext);

  // Parse filters from URL
  const search = searchParams.get('search') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const availability = searchParams.get('availability') || '';
  const discount = searchParams.get('discount') || '';
  const sort = searchParams.get('sort') || '';
  const page = searchParams.get('page') || '1';

  // Local state for listings
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  // Sidebar catalogs
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Mobile filters toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch filter catalogs (categories & brands)
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const catRes = await fetch('http://localhost:5000/api/categories').then(r => r.json());
        if (catRes.success) setCategories(catRes.data || catRes.categories || []);

        const brandRes = await fetch('http://localhost:5000/api/brands').then(r => r.json());
        if (brandRes.success) setBrands(brandRes.data || brandRes.brands || []);
      } catch (err) {
        console.error('Error fetching catalogs:', err);
      }
    };
    fetchCatalogs();
  }, []);

  // Fetch products matching parameters
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setErrorState(false);
      try {
        const queryParams = {
          search,
          brand: selectedBrand,
          category: selectedCategory,
          minPrice,
          maxPrice,
          rating,
          sort,
          page,
          limit: 8,
        };

        const res = await productService.getProducts(queryParams);
        if (res.success) {
          // Implement client-side filtering for values not directly parsed on basic backend route:
          let list = res.products;

          // Client-side availability filter
          if (availability === 'in') {
            list = list.filter(p => (p.stock.quantity - p.stock.reservedQuantity) > 0);
          } else if (availability === 'out') {
            list = list.filter(p => (p.stock.quantity - p.stock.reservedQuantity) <= 0);
          }

          // Client-side discount filter (e.g. discount >= selected)
          if (discount) {
            const minDiscount = Number(discount);
            list = list.filter(p => {
              const discPercent = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
              return discPercent >= minDiscount;
            });
          }

          setProducts(list);
          setTotalProducts(res.total);
          setTotalPages(res.pages);
        }
      } catch (err) {
        setErrorState(true);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [search, selectedBrand, selectedCategory, minPrice, maxPrice, rating, availability, discount, sort, page]);

  // Sync state helpers
  const updateQueryParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1'); // reset page
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleToggleBrand = (slug) => {
    let current = selectedBrand ? selectedBrand.split(',') : [];
    if (current.includes(slug)) {
      current = current.filter(b => b !== slug);
    } else {
      current.push(slug);
    }
    updateQueryParam('brand', current.join(','));
  };

  const handleToggleCategory = (slug) => {
    let current = selectedCategory ? selectedCategory.split(',') : [];
    if (current.includes(slug)) {
      current = current.filter(c => c !== slug);
    } else {
      current.push(slug);
    }
    updateQueryParam('category', current.join(','));
  };

  // Predefined ranges
  const priceRanges = [
    { label: 'Under ₹10,000', min: '0', max: '10000' },
    { label: '₹10,000 – ₹25,000', min: '10000', max: '25000' },
    { label: '₹25,000 – ₹50,000', min: '25000', max: '50000' },
    { label: '₹50,000 – ₹1,00,000', min: '50000', max: '100000' },
    { label: 'Above ₹1,00,000', min: '100000', max: '1000000' },
  ];

  return (
    <Container className="py-10 text-left space-y-8 select-none">
      
      {/* 1. Breadcrumbs */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800 transition-colors">Home</Link>
        <span>&gt;</span>
        <Link to="/products" className="hover:text-brand-gray-800 transition-colors">Products</Link>
        {selectedCategory && (
          <>
            <span>&gt;</span>
            <span className="text-brand-gray-700 capitalize">{selectedCategory.split(',')[0]}</span>
          </>
        )}
      </nav>

      {/* 2. Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 tracking-tight">
            {search ? `Search results for "${search}"` : 'Verify Genuine Technology'}
          </h1>
          <p className="text-xs text-brand-gray-500 mt-1">
            {totalProducts ? `Showing ${products.length} of ${totalProducts} products` : 'No products available'}
          </p>
        </div>

        {/* Sort and mobile trigger controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
          <div className="flex items-center space-x-2 bg-white border border-brand-gray-200 px-3 py-2 rounded-sm text-xs">
            <ArrowUpDown className="w-4 h-4 text-brand-gray-500" />
            <select
              value={sort}
              onChange={(e) => updateQueryParam('sort', e.target.value)}
              className="bg-transparent border-none text-brand-gray-800 focus:ring-0 cursor-pointer font-bold uppercase tracking-wider"
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating: High to Low</option>
            </select>
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center justify-center space-x-2 bg-brand-dark text-white px-4 py-2.5 rounded-sm text-xs w-full"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* 3. Left filter sidebar (Desktop) */}
        <aside className="hidden md:block bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-6 text-xs text-brand-gray-650">
          <div className="flex justify-between items-center pb-4 border-b">
            <h3 className="font-extrabold text-brand-gray-900 uppercase tracking-wider">Filters Catalog</h3>
            <button onClick={handleClearAll} className="text-[10px] text-brand-accent hover:underline font-bold uppercase">
              Clear All
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-950 uppercase tracking-wider">Categories</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedCategory.split(',').includes(cat.slug)}
                    onChange={() => handleToggleCategory(cat.slug)}
                    className="rounded text-brand-accent focus:ring-brand-accent w-4 h-4"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-950 uppercase tracking-wider">Brands</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {brands.map((b) => (
                <label key={b._id} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedBrand.split(',').includes(b.slug)}
                    onChange={() => handleToggleBrand(b.slug)}
                    className="rounded text-brand-accent focus:ring-brand-accent w-4 h-4"
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filters */}
          <div className="space-y-3 pb-4 border-b font-medium">
            <h4 className="font-bold text-brand-gray-955 uppercase tracking-wider">Price Range</h4>
            <div className="space-y-2">
              {priceRanges.map((range, idx) => (
                <label key={idx} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-950">
                  <input
                    type="radio"
                    name="price_range"
                    checked={minPrice === range.min && maxPrice === range.max}
                    onChange={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('minPrice', range.min);
                      params.set('maxPrice', range.max);
                      params.set('page', '1');
                      setSearchParams(params);
                    }}
                    className="text-brand-accent focus:ring-brand-accent w-4.5 h-4.5"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-955 uppercase tracking-wider">Rating</h4>
            <div className="space-y-2">
              {[4, 3, 2].map((stars) => (
                <label key={stars} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-950">
                  <input
                    type="radio"
                    name="rating_range"
                    checked={rating === stars.toString()}
                    onChange={() => updateQueryParam('rating', stars.toString())}
                    className="text-brand-accent focus:ring-brand-accent w-4.5 h-4.5"
                  />
                  <span>{stars} ★ & Up</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-955 uppercase tracking-wider">Availability</h4>
            <div className="space-y-2">
              {[
                { label: 'In Stock Only', value: 'in' },
                { label: 'Include Out of Stock', value: '' },
              ].map((stockOpt) => (
                <label key={stockOpt.value} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-950">
                  <input
                    type="radio"
                    name="stock_range"
                    checked={availability === stockOpt.value}
                    onChange={() => updateQueryParam('availability', stockOpt.value)}
                    className="text-brand-accent focus:ring-brand-accent w-4.5 h-4.5"
                  />
                  <span>{stockOpt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Discount options */}
          <div className="space-y-3">
            <h4 className="font-bold text-brand-gray-955 uppercase tracking-wider">Discounts</h4>
            <div className="space-y-2">
              {['10', '20', '30', '50'].map((discVal) => (
                <label key={discVal} className="flex items-center space-x-2 cursor-pointer hover:text-brand-gray-950">
                  <input
                    type="radio"
                    name="discount_range"
                    checked={discount === discVal}
                    onChange={() => updateQueryParam('discount', discVal)}
                    className="text-brand-accent focus:ring-brand-accent w-4.5 h-4.5"
                  />
                  <span>{discVal}% Off or More</span>
                </label>
              ))}
            </div>
          </div>

        </aside>

        {/* 4. Product grid display */}
        <div className="md:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : errorState ? (
            <div className="bg-white border p-12 text-center text-brand-gray-500">Error loading products. Check backend API servers.</div>
          ) : products.length === 0 ? (
            <EmptyState type="search" onAction={handleClearAll} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((prod) => {
                const imageUrl = prod.images[0]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=550';
                const discount = prod.mrp > prod.sellingPrice ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100) : 0;
                const inStock = (prod.stock.quantity - prod.stock.reservedQuantity) > 0;

                return (
                  <div
                    key={prod._id}
                    className="bg-white border border-brand-gray-200 rounded-sm overflow-hidden shadow-premium hover:border-brand-accent transition-all duration-300 group flex flex-col justify-between relative"
                  >
                    {/* Top badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col space-y-1.5 items-start">
                      {discount > 0 && <Badge variant="deal">Save {discount}%</Badge>}
                      {!inStock && <Badge variant="out_of_stock">Out of Stock</Badge>}
                    </div>

                    <button
                      onClick={() => setQuickViewProduct(prod)}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full border text-brand-gray-400 hover:text-brand-accent opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Image links */}
                    <Link to={`/product/${prod.slug}`}>
                      <Image src={imageUrl} alt={prod.name} aspectRatio="aspect-video" />
                    </Link>

                    {/* Details body */}
                    <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-3">
                      <div className="space-y-1">
                        <p className="text-[9px] text-brand-gray-450 font-bold uppercase tracking-wider">{prod.brand?.name}</p>
                        <Link
                          to={`/product/${prod.slug}`}
                          className="font-bold text-xs text-brand-gray-900 line-clamp-2 hover:text-brand-accent transition-colors"
                        >
                          {prod.name}
                        </Link>
                        
                        <div className="flex items-center space-x-1.5 text-[9px] text-brand-gray-500 pt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-brand-gray-800">{prod.ratings?.average || 4.5}</span>
                          <span>({prod.ratings?.count || 12})</span>
                        </div>
                      </div>

                      {/* Add button */}
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xs font-black text-brand-gray-950">₹{prod.sellingPrice.toLocaleString()}</span>
                          {prod.mrp > prod.sellingPrice && (
                            <span className="text-[9px] text-brand-gray-450 line-through">₹{prod.mrp.toLocaleString()}</span>
                          )}
                        </div>

                        {inStock ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addToCart(prod, 1, {})}
                            className="w-full text-[9px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 border-none"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" disabled className="w-full text-[9px] font-bold uppercase">
                            Sold Out
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* 5. Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 border-t pt-6">
              <button
                disabled={page === '1'}
                onClick={() => updateQueryParam('page', (Number(page) - 1).toString())}
                className="p-2 border rounded hover:bg-brand-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5 text-brand-gray-700" />
              </button>
              <span className="text-xs font-bold text-brand-gray-700 uppercase">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={Number(page) >= totalPages}
                onClick={() => updateQueryParam('page', (Number(page) + 1).toString())}
                className="p-2 border rounded hover:bg-brand-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5 text-brand-gray-700" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* 6. Quick View Overlay Modal */}
      {quickViewProduct && (
        <Modal
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          title={`Quick View: ${quickViewProduct.brand?.name || 'Item'}`}
          size="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start text-xs text-brand-gray-650">
            <div className="sm:col-span-5 bg-brand-gray-50 border p-3 flex items-center justify-center">
              <img
                src={quickViewProduct.images[0]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=550'}
                alt=""
                className="object-contain max-h-48 w-full"
              />
            </div>
            
            <div className="sm:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-accent uppercase tracking-wider">
                  {quickViewProduct.brand?.name}
                </span>
                <h3 className="font-extrabold text-sm text-brand-gray-900 leading-snug">
                  {quickViewProduct.name}
                </h3>
              </div>

              <div className="flex items-baseline space-x-2 pt-1">
                <span className="text-base font-black text-brand-gray-950">₹{quickViewProduct.sellingPrice.toLocaleString()}</span>
                {quickViewProduct.mrp > quickViewProduct.sellingPrice && (
                  <span className="text-xs text-brand-gray-400 line-through">₹{quickViewProduct.mrp.toLocaleString()}</span>
                )}
              </div>

              <div className="space-y-1 bg-brand-gray-50 p-3 border rounded-sm font-mono text-[10px] text-brand-gray-600">
                <p className="font-bold border-b pb-1 text-brand-gray-800 uppercase">Highlights:</p>
                {Object.entries(quickViewProduct.specifications || {}).slice(0, 3).map(([key, val]) => (
                  <p key={key} className="pt-1">
                    <span className="font-bold text-brand-gray-700">{key}:</span> {val}
                  </p>
                ))}
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    addToCart(quickViewProduct, 1, {});
                    setQuickViewProduct(null);
                  }}
                  className="flex-1 text-xs"
                >
                  Add to Cart
                </Button>
                <Link to={`/product/${quickViewProduct.slug}`} className="flex-1">
                  <Button variant="outline" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </Modal>
      )}

      {/* 7. Mobile filter drawer overlay */}
      <Drawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Listings"
        position="right"
        width="max-w-xs"
      >
        <div className="space-y-6 text-xs text-brand-gray-650">
          
          {/* Categories */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-950 uppercase tracking-wider">Categories</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategory.split(',').includes(cat.slug)}
                    onChange={() => handleToggleCategory(cat.slug)}
                    className="rounded text-brand-accent w-4 h-4"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-3 pb-4 border-b">
            <h4 className="font-bold text-brand-gray-950 uppercase tracking-wider">Brands</h4>
            <div className="space-y-2">
              {brands.map((b) => (
                <label key={b._id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrand.split(',').includes(b.slug)}
                    onChange={() => handleToggleBrand(b.slug)}
                    className="rounded text-brand-accent w-4 h-4"
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" onClick={handleClearAll} className="flex-1 text-xs">
              Clear All
            </Button>
            <Button variant="primary" onClick={() => setMobileFilterOpen(false)} className="flex-1 text-xs">
              Apply
            </Button>
          </div>

        </div>
      </Drawer>

    </Container>
  );
};

export default Products;
