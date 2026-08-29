import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

// UI Layout Components
import Container from '../../components/ui/Container';
import ProductGrid from '../../components/product/ProductGrid';
import { ProductSkeleton } from '../../components/feedback/Skeleton';

// Homepage Sections
import HeroSection from '../../components/home/HeroSection';
import TrustHighlights from '../../components/home/TrustHighlights';
import FeaturedCategories from '../../components/home/FeaturedCategories';
import FeaturedBrands from '../../components/home/FeaturedBrands';
import PromoBanner from '../../components/home/PromoBanner';
import WhyKaia from '../../components/home/WhyKaia';
import MarketplaceBenefits from '../../components/home/MarketplaceBenefits';
import RecentlyViewed from '../../components/home/RecentlyViewed';
import NewsletterSection from '../../components/home/NewsletterSection';

const Home = () => {
  const [trending, setTrending] = useState([]);
  const [deals, setDeals] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      setLoading(true);
      try {
        // Fetch trending products (limit 4)
        const trendRes = await axiosInstance.get('/products?limit=4');
        if (trendRes.data.success) setTrending(trendRes.data.products);

        // Fetch deals (products with active discount mrp > sellingPrice)
        const dealRes = await axiosInstance.get('/products?limit=4'); // Reusing or filter
        if (dealRes.data.success) {
          const discountDeals = dealRes.data.products.filter(p => p.mrp > p.sellingPrice);
          setDeals(discountDeals.length > 0 ? discountDeals : dealRes.data.products);
        }

        // Fetch arrivals
        const arrivalRes = await axiosInstance.get('/products?limit=4&sort=createdAt');
        if (arrivalRes.data.success) setArrivals(arrivalRes.data.products);

        // Fetch best sellers
        const sellerRes = await axiosInstance.get('/products?limit=4&sort=rating');
        if (sellerRes.data.success) setSellers(sellerRes.data.products);

      } catch (err) {
        console.error('Error loading homepage product sections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Hero banner Slider */}
      <HeroSection />

      {/* 2. Trust highlights belt */}
      <TrustHighlights />

      {/* 3. Browse Category cards */}
      <FeaturedCategories />

      {/* 4. Authorized Brand hub circles */}
      <FeaturedBrands />

      {/* 5. Trending grid */}
      <section className="py-16 bg-white text-left">
        <Container className="space-y-8">
          <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Trending Hardware Now</h2>
              <p className="text-xs text-brand-gray-500 mt-1">High-demand desktop, PC gaming, and flagship mobile models.</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={trending} />
          )}
        </Container>
      </section>

      {/* 6. Premium workspace Promo Banner */}
      <PromoBanner />

      {/* 7. Active deals list */}
      <section className="py-16 bg-white border-b text-left">
        <Container className="space-y-8">
          <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Today's Technology Deals</h2>
              <p className="text-xs text-brand-gray-500 mt-1">Limited-stock pricing offsets direct from brand warehouse lots.</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
              <span>All Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={deals} />
          )}
        </Container>
      </section>

      {/* 8. New Arrivals list */}
      <section className="py-16 bg-brand-light text-left">
        <Container className="space-y-8">
          <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">New Arrivals</h2>
              <p className="text-xs text-brand-gray-500 mt-1">Discover recently authorized electronics additions.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={arrivals} />
          )}
        </Container>
      </section>

      {/* 9. Best Sellers list */}
      <section className="py-16 bg-white text-left">
        <Container className="space-y-8">
          <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Best Sellers</h2>
              <p className="text-xs text-brand-gray-500 mt-1">Highly-rated technology catalog choices from all brands.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : (
            <ProductGrid products={sellers} />
          )}
        </Container>
      </section>

      {/* 10. Guarantee explanation */}
      <WhyKaia />

      {/* 11. Logistics splits benefits */}
      <MarketplaceBenefits />

      {/* 12. Localstorage recently viewed history */}
      <RecentlyViewed />

      {/* 13. Newsletter updates subscription */}
      <NewsletterSection />
    </div>
  );
};

export default Home;
