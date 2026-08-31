import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Container from '../ui/Container';
import ProductGrid from '../product/ProductGrid';

const RecentlyViewed = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const list = localStorage.getItem('kaia_recently_viewed');
    if (list) {
      try {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(item => item && (item._id || item.id || item.name));
          setProducts(valid.slice(0, 4)); // Only show top 4
        }
      } catch (err) {
        console.error('Error parsing recently viewed:', err);
      }
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('kaia_recently_viewed');
    setProducts([]);
  };

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-brand-light text-left select-none">
      <Container className="space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Recently Viewed Technology</h2>
            <p className="text-xs text-brand-gray-500 mt-1">Pick up where you left off in your hardware search.</p>
          </div>
          <button
            onClick={handleClear}
            className="text-[10px] text-brand-gray-400 hover:text-red-500 font-bold uppercase tracking-wider flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* Product Grid Mapping */}
        <ProductGrid products={products} />

      </Container>
    </section>
  );
};

export default RecentlyViewed;
