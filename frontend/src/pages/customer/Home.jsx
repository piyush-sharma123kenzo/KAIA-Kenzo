import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, ShieldCheck, ArrowRight, Star, 
  Truck, Award, RotateCcw, Headphones, Heart, LayoutGrid,
  CreditCard, Shield, Zap, Sparkles, Percent
} from 'lucide-react';
import productService from '../../services/productService';
import brandService from '../../services/brandService';
import { getBrandLogo } from '../../utils/brandLogos';
import { getAccurateProductImage } from '../../utils/productImageMap';

// 10 Key Component Categories with Premium 3D Hardware Renders
const hardwareCategories = [
  {
    name: 'Processors',
    slug: 'pc-components',
    query: 'processor',
    img: '/assets/categories/3d/cpu_3d.jpg',
  },
  {
    name: 'Motherboards',
    slug: 'pc-components',
    query: 'motherboard',
    img: '/assets/categories/3d/motherboard_3d.jpg',
  },
  {
    name: 'Graphics Cards',
    slug: 'pc-components',
    query: 'graphics',
    img: '/assets/categories/3d/gpu_3d.jpg',
  },
  {
    name: 'RAM',
    slug: 'pc-components',
    query: 'ram',
    img: '/assets/categories/3d/ram_3d.jpg',
  },
  {
    name: 'SSDs',
    slug: 'storage',
    query: 'ssd',
    img: '/assets/categories/3d/ssd_3d.jpg',
  },
  {
    name: 'Power Supplies',
    slug: 'pc-components',
    query: 'psu',
    img: '/assets/categories/3d/psu_3d.jpg',
  },
  {
    name: 'Cooling',
    slug: 'pc-components',
    query: 'cooler',
    img: '/assets/categories/3d/cooler_3d.jpg',
  },
  {
    name: 'PC Cases',
    slug: 'pc-components',
    query: 'case',
    img: '/assets/categories/3d/case_3d.jpg',
  },
  {
    name: 'Monitors',
    slug: 'monitors-and-displays',
    query: 'monitor',
    img: '/assets/categories/3d/monitor_3d.jpg',
  },
  {
    name: 'View All',
    slug: 'all',
    isViewAll: true,
  },
];

const topBrandNames = [
  'ASUS', 'Acer', 'Lenovo', 'Dell', 'HP', 'LG', 'Samsung', 
  'MI', 'OPPO', 'VIVO', 'ZEBRONICS', 'Intel', 'AMD', 'Logitech', 'Razer', 'Canon', 'JBL'
];

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const brandsScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkBrandsScroll = () => {
    if (brandsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = brandsScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkBrandsScroll();
    window.addEventListener('resize', checkBrandsScroll);
    return () => window.removeEventListener('resize', checkBrandsScroll);
  }, []);

  const scrollBrands = (direction) => {
    if (brandsScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      brandsScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkBrandsScroll, 350);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-slate-800 select-none text-left font-sans">

      {/* ========================================================================= */}
      {/* 1. HERO CAROUSEL BANNER                                                    */}
      {/* ========================================================================= */}
      <div className="relative w-full bg-black overflow-hidden">
        <div className="relative max-w-7xl mx-auto h-[420px] md:h-[480px] flex items-center">
          
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/assets/banners/hero_hardware.jpg" 
              alt="High Performance PC Hardware" 
              className="w-full h-full object-cover object-right md:object-center"
            />
            {/* Dark gradient overlay on the left for maximum text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 md:via-black/60 to-transparent" />
          </div>

          {/* Left Text Block */}
          <div className="relative z-10 px-6 md:px-12 max-w-xl space-y-4">
            <span className="text-[#F5B400] font-black tracking-widest text-xs uppercase block">
              NEXT LEVEL PERFORMANCE
            </span>
            
            <h1 className="text-3xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.08] uppercase">
              BUILT FOR POWER.<br />
              DESIGNED TO <span className="text-[#F5B400]">WIN.</span>
            </h1>

            <div className="py-0.5 overflow-visible">
              <p className="animate-tagline-float text-slate-200 text-xs md:text-sm max-w-md font-semibold tracking-wide leading-relaxed">
                Premium hardware. Trusted brands. Unmatched performance.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/products">
                <button className="bg-[#F5B400] hover:bg-[#E0A200] text-slate-950 font-black text-xs md:text-sm px-6 py-3 rounded-full flex items-center space-x-2 shadow-lg hover:scale-105 transition-all">
                  <span>SHOP NOW</span>
                  <div className="w-5 h-5 rounded-full bg-slate-950 text-[#F5B400] flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 stroke-[3]" />
                  </div>
                </button>
              </Link>
            </div>
          </div>

          {/* Carousel Chevrons */}
          <button 
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 4 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-all border border-white/10"
            title="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveSlide((prev) => (prev === 4 ? 0 : prev + 1))}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-all border border-white/10"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carousel Pagination Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
            {[0, 1, 2, 3, 4].map((dot) => (
              <button
                key={dot}
                onClick={() => setActiveSlide(dot)}
                className={`h-2 rounded-full transition-all ${
                  activeSlide === dot ? 'w-7 bg-[#F5B400]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE-PILLAR TRUST STRIP                                                 */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-6 relative z-30">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:py-6 md:px-8 grid grid-cols-2 md:grid-cols-5 gap-6 text-left">
          
          {/* Pillar 1 */}
          <div className="flex items-center space-x-3.5">
            <Truck className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.75} />
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">FREE DELIVERY</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">On orders above ₹999</p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex items-center space-x-3.5">
            <ShieldCheck className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.75} />
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">SECURE PAYMENT</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">100% secure payment</p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex items-center space-x-3.5">
            <Award className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.75} />
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">GENUINE PRODUCTS</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">100% original products</p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="flex items-center space-x-3.5">
            <RotateCcw className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.75} />
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">7 DAYS RETURN</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Hassle free returns</p>
            </div>
          </div>

          {/* Pillar 5 */}
          <div className="flex items-center space-x-3.5 col-span-2 md:col-span-1">
            <Headphones className="w-7 h-7 text-slate-800 shrink-0" strokeWidth={1.75} />
            <div>
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight">EXPERT SUPPORT</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">24/7 customer support</p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HARDWARE CATEGORIES (10 3D Rounded Cards Grid)                         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3 text-center">
          {hardwareCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.isViewAll ? '/categories' : `/products?category=${cat.slug}&q=${cat.query || ''}`}
              className="bg-white rounded-2xl border border-slate-200/90 p-2.5 flex flex-col items-center justify-between hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-xs"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center overflow-hidden mb-1.5 p-1 bg-gradient-to-b from-slate-50/80 to-white border border-slate-100">
                {cat.isViewAll ? (
                  <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-[#F5B400] transition-colors shadow-sm">
                    <LayoutGrid className="w-6 h-6 text-white group-hover:text-slate-950 transition-colors" />
                  </div>
                ) : (
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-115 group-hover:drop-shadow-xl transition-all duration-300"
                    loading="lazy"
                  />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-600 transition-colors truncate w-full tracking-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 5. TOP BRANDS STRIP (Interactive Smooth Carousel)                          */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3.5 md:p-4 flex items-center gap-3 md:gap-4 relative">
          
          {/* Top Brands Pill */}
          <div className="bg-slate-900 text-white font-black text-[11px] md:text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B400]" />
            <span>TOP BRANDS</span>
          </div>

          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBrands('left')}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 hover:border-amber-400 flex items-center justify-center shrink-0 text-slate-800 transition-all duration-200 cursor-pointer z-10"
              title="Previous Brands"
              aria-label="Previous Brands"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Scrollable Brands Track without scrollbar */}
          <div
            ref={brandsScrollRef}
            onScroll={checkBrandsScroll}
            className="flex items-center space-x-6 md:space-x-8 overflow-x-auto py-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1"
          >
            {topBrandNames.map((brandName, idx) => (
              <Link
                key={idx}
                to={`/brand/${brandName.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-slate-600 hover:text-slate-950 font-extrabold text-xs md:text-sm uppercase tracking-wider hover:scale-105 transition-all shrink-0 select-none py-1 px-1.5 rounded-lg hover:bg-slate-50"
              >
                {brandName}
              </Link>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => scrollBrands('right')}
            disabled={!canScrollRight}
            className={`
              w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center shrink-0 
              text-slate-800 transition-all duration-200 z-10
              ${
                canScrollRight
                  ? 'hover:bg-slate-50 hover:border-amber-400 cursor-pointer opacity-100 hover:scale-105'
                  : 'opacity-40 cursor-not-allowed bg-slate-50'
              }
            `}
            title="Next Brands"
            aria-label="Next Brands"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM VALUE PROPOSITION STRIP (Black #000000 with Gold Accents)       */}
      {/* ========================================================================= */}
      <div className="bg-black text-white border-t border-white/10 py-7 px-4 md:px-8 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          
          {/* Proposition 1 */}
          <div className="flex items-center space-x-3.5">
            <CreditCard className="w-6 h-6 text-[#F5B400] shrink-0" />
            <div>
              <h5 className="text-xs font-black uppercase text-white tracking-tight">MULTIPLE PAYMENT OPTIONS</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">UPI, Cards, Net Banking & more</p>
            </div>
          </div>

          {/* Proposition 2 */}
          <div className="flex items-center space-x-3.5">
            <Percent className="w-6 h-6 text-[#F5B400] shrink-0" />
            <div>
              <h5 className="text-xs font-black uppercase text-white tracking-tight">EASY EMI OPTIONS</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">No Cost EMI on selected cards</p>
            </div>
          </div>

          {/* Proposition 3 */}
          <div className="flex items-center space-x-3.5">
            <Truck className="w-6 h-6 text-[#F5B400] shrink-0" />
            <div>
              <h5 className="text-xs font-black uppercase text-white tracking-tight">SAFE & FAST DELIVERY</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Across India</p>
            </div>
          </div>

          {/* Proposition 4 */}
          <div className="flex items-center space-x-3.5">
            <ShieldCheck className="w-6 h-6 text-[#F5B400] shrink-0" />
            <div>
              <h5 className="text-xs font-black uppercase text-white tracking-tight">100% BUYER PROTECTION</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Easy returns & refunds</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Home;
