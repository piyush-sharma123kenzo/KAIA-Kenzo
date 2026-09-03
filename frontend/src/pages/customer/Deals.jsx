import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import { ProductSkeleton } from '../../components/feedback/Skeleton';
import Button from '../../components/ui/Button';
import ViewModeSwitch from '../../components/ui/ViewModeSwitch';

const Deals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('kaia_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('kaia_view_mode', mode);
    } catch {}
  };

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const res = await productService.getDeals(16);
        if (res.success) {
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error('Error loading deals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">
              Featured Deals & Special Discounts
            </h1>
          </div>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Hand-picked enterprise and consumer electronics at direct manufacturer markdown prices.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <ViewModeSwitch
            viewMode={viewMode}
            onChange={handleViewModeChange}
            size="sm"
          />

          <Link to="/products">
            <Button variant="outline" size="sm" className="text-xs uppercase font-bold">
              All Products
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded text-center shadow-premium space-y-3">
          <Sparkles className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h2 className="text-lg font-black text-brand-gray-900 uppercase">No active promotional deals right now</h2>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            Check back soon for new flash deals and brand manufacturer promotions.
          </p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'list' ? 'grid-cols-1 gap-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'}`}>
          {products.map((p) => (
            <ProductCard key={p._id} product={p} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Deals;
