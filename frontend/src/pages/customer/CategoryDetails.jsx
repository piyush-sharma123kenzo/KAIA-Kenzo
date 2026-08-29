import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Laptop, Cpu, Smartphone, Headphones, ShieldAlert } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { categoriesData } from '../../constants/categories';

// UI components
import Container from '../../components/ui/Container';
import ProductGrid from '../../components/product/ProductGrid';
import RecentlyViewed from '../../components/home/RecentlyViewed';
import { ProductSkeleton } from '../../components/feedback/Skeleton';

const CategoryDetails = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Match local static category metadata
  const categoryInfo = categoriesData.find(c => c.slug === slug);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/products?category=${slug}&limit=8`);
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [slug]);

  if (!categoryInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-brand-gray-400 mx-auto" />
        <h3 className="text-xl font-bold text-brand-gray-800">Category not found.</h3>
        <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
          The requested technology segment does not exist. Browse our unified categories list.
        </p>
        <Link to="/categories" className="inline-block bg-brand-dark text-white font-semibold py-2.5 px-6 rounded-sm text-xs">
          Browse Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 text-left select-none">
      
      {/* Category Hero Block */}
      <section className="relative bg-brand-dark overflow-hidden py-16 px-6 border-b border-brand-gray-850">
        <div className="absolute top-0 right-0 w-96 h-full bg-brand-accent/5 pointer-events-none rounded-bl-full" />
        
        <Container className="relative z-10 space-y-6">
          {/* Breadcrumbs */}
          <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>&gt;</span>
            <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
            <span>&gt;</span>
            <span className="text-white font-bold capitalize">{categoryInfo.name}</span>
          </nav>

          <div className="max-w-2xl space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-brand-accent uppercase bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded">
              Technology Segment
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none uppercase">
              {categoryInfo.name}
            </h1>
            <p className="text-brand-gray-400 text-xs md:text-sm leading-relaxed">
              {categoryInfo.description}
            </p>
          </div>
        </Container>
      </section>

      {/* Subcategories list */}
      {categoryInfo.subcategories && categoryInfo.subcategories.length > 0 && (
        <Container className="space-y-4">
          <h3 className="font-extrabold text-xs text-brand-gray-900 uppercase tracking-wider pb-2 border-b">
            Configure Focus Area
          </h3>
          <div className="flex flex-wrap gap-3">
            {categoryInfo.subcategories.map((sub, idx) => (
              <Link
                key={idx}
                to={`/products?category=${slug}`}
                className="bg-white border border-brand-gray-250 px-4 py-2 text-xs font-semibold text-brand-gray-700 rounded-sm hover:border-brand-accent hover:text-brand-accent transition-all"
              >
                {sub}
              </Link>
            ))}
          </div>
        </Container>
      )}

      {/* Products Grid */}
      <Container className="space-y-6">
        <div className="flex justify-between items-end border-b pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-tight">Active Listings</h3>
            <p className="text-[10px] text-brand-gray-500 mt-1">Genuine manufacturer components in this category.</p>
          </div>
          <Link to={`/products?category=${slug}`} className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
            <span>Filter Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border p-12 text-center text-xs text-brand-gray-500 italic rounded-sm">
            No products are currently available in this category. Check back shortly.
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </Container>

      {/* Local storage recently viewed */}
      <RecentlyViewed />

    </div>
  );
};

export default CategoryDetails;
