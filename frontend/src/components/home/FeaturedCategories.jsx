import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Smartphone, Monitor, Cpu, Keyboard, Headphones, Camera, ArrowRight } from 'lucide-react';
import categoryService from '../../services/categoryService';
import Container from '../ui/Container';

const iconMap = {
  computers: Laptop,
  laptops: Laptop,
  'mobile-devices': Smartphone,
  smartphones: Smartphone,
  'audio-and-sound': Headphones,
  headphones: Headphones,
  'pc-components': Cpu,
  'keyboards-and-accessories': Keyboard,
  'monitors-and-displays': Monitor,
  'cameras-and-imaging': Camera,
};

const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success && res.categories && res.categories.length > 0) {
          // Take top 5 parent categories
          const parentCats = res.categories.filter(c => !c.parentCategory).slice(0, 5);
          setCategories(parentCats.length > 0 ? parentCats : res.categories.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading featured categories:', err);
      }
    };
    fetchCats();
  }, []);

  const displayCategories = categories.length > 0 ? categories : [
    { name: 'Computers', slug: 'computers', description: 'Laptops, Workstations & Desktops' },
    { name: 'Mobile Devices', slug: 'mobile-devices', description: 'Next-gen flagship smartphones' },
    { name: 'PC Components', slug: 'pc-components', description: 'CPUs, GPUs, and performance RAM' },
    { name: 'Keyboards & Mice', slug: 'keyboards-and-accessories', description: 'Custom keyboards & accessories' },
    { name: 'Audio Systems', slug: 'audio-and-sound', description: 'ANC headsets and studio sound' },
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
          <Link to="/categories" className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {displayCategories.map((cat, idx) => {
            const Icon = iconMap[cat.slug] || Laptop;
            return (
              <Link
                key={cat.slug || idx}
                to={`/categories/${cat.slug}`}
                className="bg-white border border-brand-gray-200 p-6 rounded-sm text-center shadow-premium hover:border-brand-accent hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-sm bg-brand-gray-50 flex items-center justify-center mx-auto mb-4 text-brand-gray-700 group-hover:bg-brand-accent/5 group-hover:text-brand-accent transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-brand-gray-900 group-hover:text-brand-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-brand-gray-400 mt-1 leading-snug line-clamp-1">{cat.description || cat.desc}</p>
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
