import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Laptop, Smartphone, Cpu, Keyboard, Headphones, ArrowRight } from 'lucide-react';
import { categoriesData } from '../../constants/categories';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const iconMap = {
  Laptop,
  Smartphone,
  Cpu,
  Keyboard,
  Headphones
};

const Categories = () => {
  const [search, setSearch] = useState('');

  // Filter list
  const filteredCategories = categoriesData.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-12 text-left space-y-10 select-none">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800 transition-colors">Home</Link>
        <span>&gt;</span>
        <span className="text-brand-gray-800 font-bold">Categories</span>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">Explore Technology Categories</h1>
          <p className="text-xs text-brand-gray-500">
            Find the right components and electronics verified directly by brand warehouses.
          </p>
        </div>

        {/* Category search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs focus:ring-0 focus:border-brand-accent placeholder:text-brand-gray-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-450 pointer-events-none" />
        </div>
      </div>

      {/* Category Grid */}
      {filteredCategories.length === 0 ? (
        <div className="py-20 text-center text-brand-gray-450 italic text-xs">No matching categories found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredCategories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Laptop;
            return (
              <div
                key={cat.id}
                className="bg-white border border-brand-gray-200 rounded-sm overflow-hidden shadow-premium hover:border-brand-accent transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Header Banner Image */}
                <div className="h-40 bg-brand-gray-50 overflow-hidden relative border-b">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-brand-dark/80 text-white p-2 rounded-sm border border-brand-gray-800">
                    <IconComponent className="w-5 h-5 text-brand-accent" />
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-6 text-left flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-base text-brand-gray-900 group-hover:text-brand-accent transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-brand-gray-500 leading-relaxed font-semibold">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-[10px] bg-brand-light text-brand-gray-600 font-extrabold px-2.5 py-1 rounded">
                      {cat.productCount} Products
                    </span>
                    <Link to={`/categories/${cat.slug}`}>
                      <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 border-none hover:bg-transparent hover:text-brand-accent">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </Container>
  );
};

export default Categories;
