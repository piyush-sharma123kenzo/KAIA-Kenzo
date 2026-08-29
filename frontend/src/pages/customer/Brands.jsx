import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, ArrowRight } from 'lucide-react';
import { brandsData } from '../../constants/brands';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const Brands = () => {
  const [search, setSearch] = useState('');

  // Filter list
  const filteredBrands = brandsData.filter(brand =>
    brand.name.toLowerCase().includes(search.toLowerCase()) ||
    brand.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-12 text-left space-y-10 select-none">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800 transition-colors">Home</Link>
        <span>&gt;</span>
        <span className="text-brand-gray-800 font-bold">Brands</span>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">Brands You Trust</h1>
          <p className="text-xs text-brand-gray-500">
            Explore authentic technology directories straight from authorized brand partners.
          </p>
        </div>

        {/* Brand search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs focus:ring-0 focus:border-brand-accent placeholder:text-brand-gray-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-450 pointer-events-none" />
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="py-20 text-center text-brand-gray-450 italic text-xs">No brand found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white border border-brand-gray-200 rounded-sm p-6 text-center hover:border-brand-accent transition-all duration-300 flex flex-col justify-between items-center group relative shadow-premium"
            >
              {/* Verified badge */}
              {brand.verified && (
                <span className="absolute top-3 right-3 flex items-center space-x-1 text-[9px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded font-extrabold uppercase">
                  <CheckCircle className="w-3 h-3 shrink-0 text-green-600" />
                  <span>Verified</span>
                </span>
              )}

              {/* Logo / Image placeholder */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-light flex items-center justify-center p-2 mb-4 border border-brand-gray-200 group-hover:border-brand-accent transition-colors duration-300">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="object-cover h-full w-full rounded-full"
                />
              </div>

              {/* Details */}
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-brand-gray-900 group-hover:text-brand-accent transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-[10px] text-brand-gray-500 mt-1 leading-relaxed max-w-[200px] mx-auto font-semibold">
                    {brand.description}
                  </p>
                </div>

                <div className="pt-4 border-t w-full flex justify-between items-center mt-4">
                  <span className="text-[9px] bg-brand-light text-brand-gray-600 font-extrabold px-2 py-0.5 rounded">
                    {brand.productCount} Products
                  </span>
                  <Link to={`/brands/${brand.slug}`}>
                    <Button variant="outline" size="sm" className="text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 border-none hover:bg-transparent hover:text-brand-accent">
                      <span>Browse</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </Container>
  );
};

export default Brands;
