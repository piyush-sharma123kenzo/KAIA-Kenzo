import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Laptop, Smartphone, Cpu, Keyboard, Headphones, 
  Monitor, Camera, ArrowRight, HardDrive, Watch, Server, 
  Gamepad2, Zap, Layers, Speaker, Sparkles, ChevronRight
} from 'lucide-react';
import categoryService from '../../services/categoryService';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';

const getCategoryIcon = (slug = '', name = '') => {
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('laptop') || s.includes('notebook')) return Laptop;
  if (s.includes('smart') || s.includes('mobile') || s.includes('phone') || s.includes('tablet')) return Smartphone;
  if (s.includes('audio') || s.includes('sound') || s.includes('headphone') || s.includes('earbud')) return Headphones;
  if (s.includes('speaker')) return Speaker;
  if (s.includes('component') || s.includes('cpu') || s.includes('processor')) return Cpu;
  if (s.includes('gpu') || s.includes('graphic')) return Zap;
  if (s.includes('keyboard') || s.includes('mice') || s.includes('mouse') || s.includes('peripheral')) return Keyboard;
  if (s.includes('monitor') || s.includes('display') || s.includes('screen') || s.includes('tv')) return Monitor;
  if (s.includes('camera') || s.includes('lens') || s.includes('imaging')) return Camera;
  if (s.includes('storage') || s.includes('ssd') || s.includes('hdd') || s.includes('drive')) return HardDrive;
  if (s.includes('watch') || s.includes('wearable')) return Watch;
  if (s.includes('server') || s.includes('network') || s.includes('cloud')) return Server;
  if (s.includes('game') || s.includes('gaming') || s.includes('console')) return Gamepad2;
  if (s.includes('desktop') || s.includes('computer') || s.includes('workstation')) return Laptop;
  return Layers;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await categoryService.getCategories();
        if (res.success) {
          setCategories(res.categories || res.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Filter list
  const filteredCategories = categories.filter(cat =>
    (cat.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (cat.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-12 text-left space-y-10 select-none max-w-7xl font-sans">
      
      {/* Breadcrumb */}
      <nav className="text-xs text-brand-gray-400 font-semibold flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-gray-800 transition-colors">Home</Link>
        <span>&gt;</span>
        <span className="text-brand-gray-800 font-bold">Departments</span>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Explore Technology Departments
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Browse verified electronics departments and authentic manufacturer hardware catalogs.
          </p>
        </div>

        {/* Category search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search departments & categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400 text-slate-900 font-medium shadow-xs"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-20 text-center text-slate-400 italic text-xs bg-white rounded-2xl border border-slate-200">
          No matching departments found for "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.slug, cat.name);
            return (
              <Link
                key={cat.id || cat._id || idx}
                to={`/categories/${cat.slug}`}
                className="group bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Icon & Badge Header */}
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center border border-slate-800 shadow-xs group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:scale-105 transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-amber-50 group-hover:text-amber-800 group-hover:border-amber-200 transition-colors">
                      {cat.parentCategory ? 'Sub-Category' : 'Department'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition-colors tracking-tight">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-2">
                      {cat.description || 'Authorized electronics hardware category fulfilled directly from verified brand warehouses.'}
                    </p>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Direct Warranty Support
                  </span>
                  
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all">
                    <span>Explore Catalog</span>
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

export default Categories;
