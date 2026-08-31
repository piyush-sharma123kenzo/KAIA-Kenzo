import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, ArrowRight, ShieldAlert, Landmark, Truck, Headphones } from 'lucide-react';
import brandService from '../../services/brandService';
import productService from '../../services/productService';

// UI components
import Container from '../../components/ui/Container';
import ProductGrid from '../../components/product/ProductGrid';
import { ProductSkeleton, Skeleton } from '../../components/feedback/Skeleton';
import StatusBadge from '../../components/ui/StatusBadge';

const BrandDetails = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Selected category state from query param
  const activeCategory = searchParams.get('category') || '';

  const [brandInfo, setBrandInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // 1. Fetch Brand Profile from API
  useEffect(() => {
    const fetchBrand = async () => {
      setLoadingBrand(true);
      try {
        const res = await brandService.getBrandBySlug(slug);
        if (res.success) {
          setBrandInfo(res.brand || res.data);
        } else {
          setBrandInfo(null);
        }
      } catch (err) {
        console.error('Error fetching brand profile:', err);
        setBrandInfo(null);
      } finally {
        setLoadingBrand(false);
      }
    };
    fetchBrand();
  }, [slug]);

  // 2. Fetch Brand Products from API
  useEffect(() => {
    const fetchBrandProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productService.getProducts({
          brand: slug,
          category: activeCategory || '',
          limit: 16,
        });
        if (res.success) {
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Error fetching brand products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchBrandProducts();
  }, [slug, activeCategory]);

  if (loadingBrand) {
    return (
      <Container className="py-16 animate-pulse space-y-8">
        <Skeleton className="h-48 w-full rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      </Container>
    );
  }

  if (!brandInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-brand-gray-400 mx-auto" />
        <h3 className="text-xl font-bold text-brand-gray-800">Brand not found.</h3>
        <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
          The requested manufacturer profile is not active. Browse our verified brands directory.
        </p>
        <Link to="/brands" className="inline-block bg-brand-dark text-white font-semibold py-2.5 px-6 rounded-sm text-xs">
          Browse Brands
        </Link>
      </div>
    );
  }

  const handleToggleCategory = (catSlug) => {
    const params = new URLSearchParams(searchParams);
    if (activeCategory === catSlug) {
      params.delete('category');
    } else {
      params.set('category', catSlug);
    }
    setSearchParams(params);
  };

  return (
    <div className="space-y-12 pb-20 text-left select-none">
      
      {/* Brand Hero Banner */}
      <section className="relative bg-brand-dark overflow-hidden py-16 px-6 border-b border-brand-gray-850">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${brandInfo.banner})` }} />
        
        <Container className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-8 space-y-4">
            {/* Breadcrumbs */}
            <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>&gt;</span>
              <Link to="/brands" className="hover:text-white transition-colors">Brands</Link>
              <span>&gt;</span>
              <span className="text-white font-bold capitalize">{brandInfo.name}</span>
            </nav>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase leading-none">
                  {brandInfo.name}
                </h1>
                {brandInfo.verified && (
                  <StatusBadge status="Delivered" className="bg-green-50/10 text-green-400 border-green-500/20 text-[9px] uppercase tracking-wider font-extrabold">
                    Verified Partner
                  </StatusBadge>
                )}
              </div>
              <p className="text-brand-gray-455 text-xs md:text-sm leading-relaxed max-w-xl">
                {brandInfo.description}
              </p>
            </div>
          </div>

          {/* Logo card right panel */}
          <div className="md:col-span-4 flex md:justify-end">
            <div className="bg-brand-surface border border-brand-gray-800 p-6 rounded-sm flex flex-col items-center space-y-3 w-44 shadow-premiumDark">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-dark flex items-center justify-center p-2 border border-brand-gray-850">
                <img src={brandInfo.logo} alt="" className="object-cover h-full w-full rounded-full" />
              </div>
              <span className="text-[10px] bg-brand-dark border border-brand-gray-850 text-brand-gray-400 px-3 py-1 rounded font-bold uppercase">
                {brandInfo.productCount} Products
              </span>
            </div>
          </div>

        </Container>
      </section>

      {/* Brand category filters */}
      {brandInfo.categories && brandInfo.categories.length > 0 && (
        <Container className="space-y-4">
          <h3 className="font-extrabold text-xs text-brand-gray-900 uppercase tracking-wider pb-2 border-b">
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            {brandInfo.categories.map((catSlug) => (
              <button
                key={catSlug}
                onClick={() => handleToggleCategory(catSlug)}
                className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all uppercase tracking-wider ${
                  activeCategory === catSlug
                    ? 'border-brand-accent bg-brand-accent/5 text-brand-accent font-black'
                    : 'bg-white border-brand-gray-250 text-brand-gray-650 hover:border-brand-gray-400'
                }`}
              >
                {catSlug.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </Container>
      )}

      {/* Products Grid */}
      <Container className="space-y-6">
        <div className="flex justify-between items-end border-b pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-tight">Active Listings</h3>
            <p className="text-[10px] text-brand-gray-505 mt-1">Fulfillments sourced directly from {brandInfo.name} depots.</p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border p-12 text-center text-xs text-brand-gray-500 italic rounded-sm">
            No products are currently available from this brand matching the parameters.
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </Container>

      {/* Brand Guarantees strip */}
      <Container className="pt-6">
        <div className="bg-brand-light border border-brand-gray-200 rounded-sm p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3.5">
            <ShieldCheck className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-brand-gray-900 uppercase">Authorized Inventory</h4>
              <p className="text-[10px] text-brand-gray-500 leading-relaxed mt-0.5">Products verified natively from {brandInfo.name} warehouses.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5">
            <Truck className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-brand-gray-900 uppercase">Express Dispatch</h4>
              <p className="text-[10px] text-brand-gray-500 leading-relaxed mt-0.5">Sourced direct to client address via Shiprocket/Blue Dart.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5">
            <Headphones className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs text-brand-gray-900 uppercase">Warranty Covered</h4>
              <p className="text-[10px] text-brand-gray-500 leading-relaxed mt-0.5">Includes standard {brandInfo.name} manufacturer warranty cards.</p>
            </div>
          </div>
        </div>
      </Container>

    </div>
  );
};

export default BrandDetails;
