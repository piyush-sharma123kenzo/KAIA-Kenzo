import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ArrowRight } from 'lucide-react';
import Container from '../ui/Container';

const FeaturedBrands = () => {
  const brands = [
    { name: 'Apple Inc.', slug: 'apple', desc: 'Cupertino consumer devices', logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100' },
    { name: 'Samsung Electronics', slug: 'samsung', desc: 'AMOLED display smartphones', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100' },
    { name: 'ASUS ROG Hub', slug: 'asus', desc: 'Next-generation PC hardware', logo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100' },
    { name: 'Dell Technologies', slug: 'dell', desc: 'Workstation laptops & monitors', logo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=100' },
    { name: 'Sony Zone', slug: 'sony', desc: 'Flagship ANC audio systems', logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100' },
  ];

  return (
    <section className="bg-brand-dark text-white py-16 border-y border-brand-gray-850 text-left">
      <Container className="space-y-12">
        
        {/* Title Header */}
        <div className="flex justify-between items-end border-b border-brand-gray-850 pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Authorized Brand Hubs</h2>
            <p className="text-xs text-brand-gray-400 mt-1">Direct-fulfill brand partnerships mapping to official local warranty support.</p>
          </div>
          <Link to="/brands" className="text-xs font-bold text-brand-accent hover:text-white transition-colors flex items-center space-x-1 uppercase tracking-wider">
            <span>View All Brands</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Brands Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {brands.map((b, idx) => (
            <Link
              key={idx}
              to={`/products?brand=${b.slug}`}
              className="bg-brand-surface border border-brand-gray-800 p-6 rounded-sm text-center hover:border-white transition-all duration-300 flex flex-col justify-between items-center group"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-dark flex items-center justify-center p-2 mb-4 border border-brand-gray-850 group-hover:border-brand-accent transition-colors duration-300">
                <img
                  src={b.logo}
                  alt={b.name}
                  className="object-cover h-full w-full rounded-full"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-gray-200">{b.name}</h3>
                <p className="text-[10px] text-brand-gray-500 mt-1">{b.desc}</p>
              </div>
              <span className="text-[9px] text-brand-accent font-bold tracking-wider uppercase mt-3 inline-block">
                Hub Active
              </span>
            </Link>
          ))}
        </div>

      </Container>
    </section>
  );
};

export default FeaturedBrands;
