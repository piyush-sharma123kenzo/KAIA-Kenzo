import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Star, 
  Grid, List, RotateCcw, Check, X, Search, Sparkles, Filter, ChevronDown, ChevronUp 
} from 'lucide-react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import brandService from '../../services/brandService';
import { CartContext } from '../../context/CartContext';
import ProductCard from '../../components/product/ProductCard';
import { ProductSkeleton } from '../../components/feedback/Skeleton';
import Drawer from '../../components/common/Drawer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import CustomSelect from '../../components/ui/CustomSelect';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'discount-high', label: 'Biggest Discount' },
];

const PRICE_PRESETS = [
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: '₹10,000 – ₹25,000', min: 10000, max: 25000 },
  { label: '₹25,000 – ₹50,000', min: 25000, max: 50000 },
  { label: '₹50,000 – ₹1,00,000', min: 50000, max: 100000 },
  { label: 'Above ₹1,00,000', min: 100000, max: 9999999 },
];

const DISCOUNT_PRESETS = [
  { label: '50% or more', val: 50 },
  { label: '40% or more', val: 40 },
  { label: '30% or more', val: 30 },
  { label: '20% or more', val: 20 },
  { label: '10% or more', val: 10 },
];

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useContext(CartContext);

  // URL state
  const search = searchParams.get('search') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const discount = searchParams.get('discount') || '';
  const availability = searchParams.get('availability') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local state
  const [products, setProducts] = useState([]);
  const [facets, setFacets] = useState({ brands: [], categories: [] });
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Custom price input state
  const [customMin, setCustomMin] = useState(minPrice);
  const [customMax, setCustomMax] = useState(maxPrice);

  // Collapsible filter sections
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    discount: true,
    rating: true,
    availability: true,
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Helper to update specific search param
  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === undefined || val === null || val === '') {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    if (key !== 'page') next.delete('page'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  // Toggle brand in multi-brand comma list
  const handleToggleBrand = (slug) => {
    const currentList = selectedBrand ? selectedBrand.split(',').map((s) => s.trim()).filter(Boolean) : [];
    let nextList;
    if (currentList.includes(slug)) {
      nextList = currentList.filter((s) => s !== slug);
    } else {
      nextList = [...currentList, slug];
    }
    updateParam('brand', nextList.join(','));
  };

  // Clear all filters
  const handleClearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    setSearchParams(next);
    setCustomMin('');
    setCustomMax('');
    setCategorySearch('');
    setBrandSearch('');
  };

  // Fetch Category and Brand base metadata once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cRes, bRes] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands(),
        ]);
        if (cRes.success) setCategoriesList(cRes.categories || cRes.data || []);
        if (bRes.success) setBrandsList(bRes.brands || bRes.data || []);
      } catch (err) {
        console.error('Error fetching catalog metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch catalog from backend matching query params
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const queryParams = {
          search,
          brand: selectedBrand,
          category: selectedCategory,
          minPrice,
          maxPrice,
          rating,
          discount,
          availability,
          sort,
          page,
          limit: 12,
        };

        const res = await productService.getProducts(queryParams);
        if (res.success) {
          setProducts(res.products || []);
          setTotalProducts(res.pagination?.total || res.total || 0);
          setTotalPages(res.pagination?.totalPages || res.totalPages || 1);
          if (res.facets) setFacets(res.facets);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [search, selectedBrand, selectedCategory, minPrice, maxPrice, rating, discount, availability, sort, page]);

  const selectedBrandsList = selectedBrand ? selectedBrand.split(',').map((s) => s.trim()) : [];
  const hasActiveFilters = Boolean(selectedBrand || selectedCategory || minPrice || maxPrice || rating || discount || availability);

  const filteredCategories = categoriesList.filter((cat) =>
    (cat.name || '').toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredBrands = brandsList.filter((b) =>
    (b.name || '').toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Filter Sidebar Content Component
  const FilterContent = (
    <div className="space-y-6 text-left text-xs font-sans">
      {/* 0. Clear All Action */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center bg-slate-100/80 px-3 py-2.5 rounded-xl border border-slate-200/80">
          <span className="font-bold text-slate-800">Filters Applied</span>
          <button
            onClick={handleClearAll}
            className="text-xs text-rose-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* 1. Category Filter */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 cursor-pointer"
        >
          <span>Category</span>
          {openSections.categories ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.categories && (
          <div className="space-y-2 pt-1">
            {categoriesList.length > 8 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-7 pr-3 py-1.5 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => updateParam('category', '')}
                className={`flex items-center justify-between w-full py-1.5 px-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  !selectedCategory
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                }`}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-3.5 h-3.5 text-[#F5B400]" />}
              </button>
              {filteredCategories.map((cat) => {
                const active = selectedCategory === cat.slug;
                const facet = facets.categories?.find((fc) => fc.slug === cat.slug);
                return (
                  <button
                    key={cat._id || cat.slug}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`flex justify-between items-center w-full py-1.5 px-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {facet && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        active ? 'text-slate-300 bg-white/10' : 'text-slate-400 bg-slate-100'
                      }`}>
                        {facet.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Brand Multi-Filter */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          onClick={() => toggleSection('brands')}
          className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 cursor-pointer"
        >
          <span>Brand</span>
          {openSections.brands ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.brands && (
          <div className="space-y-2 pt-1">
            {brandsList.length > 8 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Filter brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-7 pr-3 py-1.5 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {filteredBrands.map((b) => {
                const checked = selectedBrandsList.includes(b.slug);
                const facet = facets.brands?.find((fb) => fb.slug === b.slug);
                return (
                  <label
                    key={b._id || b.slug}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer select-none transition-all ${
                      checked ? 'bg-amber-50/70 border border-amber-200/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleBrand(b.slug)}
                        className="rounded accent-amber-500 w-3.5 h-3.5 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-xs ${checked ? 'font-bold text-slate-950' : 'text-slate-600 font-medium'}`}>
                        {b.name}
                      </span>
                    </div>
                    {facet && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({facet.count})
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Price Filter & Range */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 cursor-pointer"
        >
          <span>Price Range</span>
          {openSections.price ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.price && (
          <div className="space-y-2 pt-1">
            <div className="space-y-1">
              {PRICE_PRESETS.map((preset, idx) => {
                const isSelected = minPrice === String(preset.min) && maxPrice === String(preset.max);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      updateParam('minPrice', preset.min);
                      updateParam('maxPrice', preset.max);
                      setCustomMin(String(preset.min));
                      setCustomMax(String(preset.max));
                    }}
                    className={`block w-full text-left py-1.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Min / Max input */}
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-20 p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-20 p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                onClick={() => {
                  updateParam('minPrice', customMin);
                  updateParam('maxPrice', customMax);
                }}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Discount Filter */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          onClick={() => toggleSection('discount')}
          className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 cursor-pointer"
        >
          <span>Discount</span>
          {openSections.discount ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.discount && (
          <div className="space-y-1 pt-1">
            {DISCOUNT_PRESETS.map((d, idx) => {
              const isSelected = discount === String(d.val);
              return (
                <button
                  key={idx}
                  onClick={() => updateParam('discount', isSelected ? '' : d.val)}
                  className={`block w-full text-left py-1.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Customer Rating Filter */}
      <div className="border-b border-slate-200/80 pb-4">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 cursor-pointer"
        >
          <span>Customer Rating</span>
          {openSections.rating ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.rating && (
          <div className="space-y-1 pt-1">
            {[4, 3, 2].map((stars) => {
              const isSelected = rating === String(stars);
              return (
                <button
                  key={stars}
                  onClick={() => updateParam('rating', isSelected ? '' : stars)}
                  className={`flex items-center space-x-2 w-full py-1.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                  }`}
                >
                  <div className="flex text-amber-400">
                    {[...Array(stars)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span>& Up</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Availability */}
      <div>
        <label className="flex items-center space-x-2.5 cursor-pointer select-none px-2 py-1">
          <input
            type="checkbox"
            checked={availability === 'inStock'}
            onChange={(e) => updateParam('availability', e.target.checked ? 'inStock' : '')}
            className="rounded accent-amber-500 w-3.5 h-3.5 focus:ring-0 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800">In Stock Items Only</span>
        </label>
      </div>
    </div>
  );

  const activeBrandObj = brandsList.find(
    (b) => (b.slug || '').toLowerCase() === selectedBrand.toLowerCase() || (b.name || '').toLowerCase() === selectedBrand.toLowerCase()
  );
  const activeBrandName = activeBrandObj?.name || (selectedBrand ? selectedBrand.charAt(0).toUpperCase() + selectedBrand.slice(1) : '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6 font-sans">
      
      {/* 1. Header with Breadcrumb & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
            {selectedBrand
              ? `${activeBrandName} — ${totalProducts} Products`
              : search
              ? `Search results for "${search}"`
              : selectedCategory
              ? `${selectedCategory.toUpperCase()} CATALOG`
              : 'Hardware & Electronics Catalog'}
          </h1>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            {selectedBrand
              ? `Showing all verified ${activeBrandName} hardware with authentic manufacturer warranty.`
              : `Showing ${totalProducts} verified electronics items with real-time warehouse inventory.`}
          </p>
        </div>

        {/* Sort & View Controls */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center space-x-1.5 py-1.5 px-3 bg-white border border-brand-gray-300 rounded text-xs font-bold text-brand-gray-800"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          {/* Modern Custom Sort Dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-bold hidden sm:inline">Sort by:</span>
            <CustomSelect
              value={sort}
              onChange={(val) => updateParam('sort', val)}
              options={SORT_OPTIONS}
              size="sm"
              className="rounded-xl font-bold text-slate-900 border-slate-200 shadow-2xs hover:border-amber-400 min-w-[155px]"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100/80 p-0.5 border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar (Desktop) */}
        <div className="hidden md:block md:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
            <span className="font-black text-xs uppercase tracking-wider text-slate-900">Catalog Filters</span>
            {hasActiveFilters && (
              <button onClick={handleClearAll} className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer">
                Reset All
              </button>
            )}
          </div>
          {FilterContent}
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          title="Catalog Filters"
        >
          <div className="p-4">
            {FilterContent}
            <div className="pt-6">
              <Button size="sm" onClick={() => setMobileFilterOpen(false)} className="w-full uppercase font-bold text-xs">
                View {totalProducts} Results
              </Button>
            </div>
          </div>
        </Drawer>

        {/* Right Product Grid/List Area */}
        <div className="md:col-span-3 space-y-8">
          
          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-brand-gray-200 p-12 rounded-sm text-center shadow-premium space-y-4">
              <Search className="w-12 h-12 text-brand-gray-300 mx-auto" />
              <h2 className="text-xl font-black text-brand-gray-900 uppercase">No Products Found</h2>
              <p className="text-xs text-brand-gray-500 max-w-md mx-auto">
                We couldn't find any hardware products matching your selected filters. Try broadening your criteria or search term.
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                <Button size="sm" onClick={handleClearAll} className="text-xs uppercase font-bold">
                  Clear Filters
                </Button>
                <Link to="/products">
                  <Button size="sm" variant="outline" className="text-xs uppercase font-bold">
                    View All Products
                  </Button>
                </Link>
              </div>

              {/* Suggestions */}
              <div className="pt-8 border-t border-brand-gray-100 max-w-lg mx-auto text-left">
                <span className="text-[11px] font-bold text-brand-gray-400 uppercase block mb-2">
                  Popular Categories to Explore:
                </span>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.slice(0, 6).map((c) => (
                    <Link
                      key={c._id}
                      to={`/category/${c.slug}`}
                      className="px-2.5 py-1 bg-brand-light hover:bg-brand-gray-100 border border-brand-gray-200 rounded text-xs font-bold text-brand-gray-800"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Products Listing */
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {/* 3. Server-Side Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-brand-gray-200 pt-6">
              <span className="text-xs text-brand-gray-500 font-mono">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalProducts} total items)
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', page - 1)}
                  className="text-xs uppercase font-bold flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pNum = i + 1;
                    if (pNum === 1 || pNum === totalPages || (pNum >= page - 1 && pNum <= page + 1)) {
                      return (
                        <button
                          key={pNum}
                          onClick={() => updateParam('page', pNum)}
                          className={`w-8 h-8 rounded text-xs font-bold font-mono transition-colors ${
                            pNum === page
                              ? 'bg-brand-accent text-white font-black'
                              : 'bg-white text-brand-gray-700 hover:bg-brand-gray-100 border border-brand-gray-200'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    }
                    if (pNum === page - 2 || pNum === page + 2) {
                      return <span key={pNum} className="text-brand-gray-400 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => updateParam('page', page + 1)}
                  className="text-xs uppercase font-bold flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Products;
