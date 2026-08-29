import React from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Smartphone, Monitor, Cpu, Keyboard, Headphones, ArrowRight } from 'lucide-react';
import Container from '../ui/Container';

const FeaturedCategories = () => {
  const categories = [
    { name: 'Laptops', slug: 'laptops', desc: 'Premium workstation computers', icon: Laptop },
    { name: 'Mobiles', slug: 'smartphones', desc: 'Next-gen flagship smartphones', icon: Smartphone },
    { name: 'Components', slug: 'pc-components', desc: 'CPUs, GPUs, and performance RAM', icon: Cpu },
    { name: 'Gear Accessories', slug: 'keyboards-and-accessories', desc: 'Mechanical keyboards and mice', icon: Keyboard },
    { name: 'Audio Systems', slug: 'audio-and-sound', desc: 'ANC headsets and studio sound', icon: Headphones },
  ];

  return (
    <section className="py-16 text-left bg-brand-light">
      <Container className="space-y-10">
        
        {/* Section Title */}
        <div className="flex justify-between items-end border-b border-brand-gray-250 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-brand-gray-900 tracking-tight">Explore Technology Categories</h2>
            <p className="text-xs text-brand-gray-500 mt-1">High-end computing hardware and authorized consumer electronics.</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/products?category=${cat.slug}`}
                className="bg-white border border-brand-gray-200 p-6 rounded-sm text-center shadow-premium hover:border-brand-accent hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-sm bg-brand-gray-50 flex items-center justify-center mx-auto mb-4 text-brand-gray-700 group-hover:bg-brand-accent/5 group-hover:text-brand-accent transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-brand-gray-900 group-hover:text-brand-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-brand-gray-400 mt-1 leading-snug">{cat.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

      </Container>
    </section>
  );
};

export default FeaturedCategories;
