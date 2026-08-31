import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import brandService from '../../services/brandService';
import Container from '../ui/Container';

const FeaturedBrands = () => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await brandService.getBrands();
        if (res.success && res.brands && res.brands.length > 0) {
          setBrands(res.brands.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading featured brands:', err);
      }
    };
    fetchBrands();
  }, []);

  const displayBrands = brands.length > 0 ? brands : [
    { name: 'Samsung', slug: 'samsung', description: 'AMOLED display smartphones', logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100' },
    { name: 'ASUS', slug: 'asus', description: 'Next-generation PC hardware', logo: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100' },
    { name: 'Dell', slug: 'dell', description: 'Workstation laptops & monitors', logo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=100' },
    { name: 'Lenovo', slug: 'lenovo', description: 'ThinkPad and Legion systems', logo: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100' },
    { name: 'Logitech', slug: 'logitech', description: 'Master productivity peripherals', logo: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100' },
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
          {displayBrands.map((b, idx) => (
            <Link
              key={b.slug || idx}
              to={`/brands/${b.slug}`}
              className="bg-brand-surface border border-brand-gray-800 p-6 rounded-sm text-center hover:border-white transition-all duration-300 flex flex-col justify-between items-center group shadow-premiumDark"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-dark flex items-center justify-center p-2 mb-4 border border-brand-gray-850 group-hover:border-brand-accent transition-colors duration-300">
                <img
                  src={b.logo || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100'}
                  alt={b.name}
                  className="object-cover h-full w-full rounded-full"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-gray-200">{b.name}</h3>
                <p className="text-[10px] text-brand-gray-500 mt-1 line-clamp-1">{b.description || b.desc}</p>
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
