import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import brandService from '../../services/brandService';
import Container from '../../components/ui/Container';
import { Skeleton } from '../../components/feedback/Skeleton';
import { getBrandLogo } from '../../utils/brandLogos';

const fallbackBrands = [
  { name: 'Samsung', slug: 'samsung' },
  { name: 'ASUS', slug: 'asus' },
  { name: 'Dell', slug: 'dell' },
  { name: 'HP', slug: 'hp' },
  { name: 'Lenovo', slug: 'lenovo' },
  { name: 'LG', slug: 'lg' },
  { name: 'MI', slug: 'mi' },
  { name: 'OPPO', slug: 'oppo' },
  { name: 'VIVO', slug: 'vivo' },
  { name: 'ZEBRONICS', slug: 'zebronics' },
  { name: 'Intel', slug: 'intel' },
  { name: 'AMD', slug: 'amd' },
  { name: 'Acer', slug: 'acer' },
  { name: 'Logitech', slug: 'logitech' },
  { name: 'Razer', slug: 'razer' },
  { name: 'Canon', slug: 'canon' },
  { name: 'JBL', slug: 'jbl' },
];

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const res = await brandService.getBrands();
        if (res.success && Array.isArray(res.brands) && res.brands.length > 0) {
          setBrands(res.brands);
        } else if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBrands(res.data);
        } else {
          setBrands(fallbackBrands);
        }
      } catch (err) {
        console.error('Error fetching brands, using fallback list:', err);
        setBrands(fallbackBrands);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Filter list
  const filteredBrands = brands.filter(brand =>
    (brand.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-10 text-left space-y-8 font-sans select-none">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <span>&gt;</span>
        <span className="text-slate-900 font-bold">Brands</span>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Explore All Brands
          </h1>
          <p className="text-xs text-slate-500">
            Browse genuine hardware and electronics straight from authorized manufacturer partners.
          </p>
        </div>

        {/* Brand search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search brands (e.g. ASUS, Samsung, Dell)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-400 font-medium"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm animate-pulse h-56">
              <Skeleton className="w-20 h-20 rounded-xl mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto rounded" />
            </div>
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="py-20 text-center text-slate-400 italic text-xs">
          No brand found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {filteredBrands.map((brand, idx) => {
            const logo = getBrandLogo(brand);
            const brandSlug = brand.slug || brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <Link
                key={brand.id || brand._id || idx}
                to={`/products?brand=${brandSlug}`}
                className="bg-white border border-slate-200/80 hover:border-amber-400/80 rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between items-center group relative shadow-xs min-h-[220px]"
              >
                {/* Brand Logo Container */}
                <div className="w-full h-24 rounded-xl bg-[#F8FAFC] group-hover:bg-amber-50/20 flex items-center justify-center p-4 mb-4 border border-slate-100 group-hover:border-amber-400/30 transition-all duration-300">
                  <img
                    src={logo}
                    alt={brand.name}
                    className="max-h-12 max-w-[120px] object-contain filter group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://unpkg.com/simple-icons@v11/icons/intel.svg';
                    }}
                  />
                </div>

                {/* Brand Name */}
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                  {brand.name}
                </h3>

                {/* Shop Now Action */}
                <div className="pt-3 mt-2 border-t border-slate-100 w-full flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-700 group-hover:text-amber-800 flex items-center space-x-1 group-hover:translate-x-1 transition-all">
                    <span>Shop Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </Container>
  );
};

export default Brands;
