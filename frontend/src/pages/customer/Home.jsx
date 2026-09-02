import React, { useState, useEffect } from 'react';
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

// 10 Key Component Categories with Real Authentic Imagery
const hardwareCategories = [
  {
    name: 'Processors',
    slug: 'pc-components',
    query: 'processor',
    img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Motherboards',
    slug: 'pc-components',
    query: 'motherboard',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Graphics Cards',
    slug: 'pc-components',
    query: 'graphics',
    img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'RAM',
    slug: 'pc-components',
    query: 'ram',
    img: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'SSDs',
    slug: 'storage',
    query: 'ssd',
    img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Power Supplies',
    slug: 'pc-components',
    query: 'psu',
    img: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cooling',
    slug: 'pc-components',
    query: 'cooler',
    img: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'PC Cases',
    slug: 'pc-components',
    query: 'case',
    img: 'https://images.unsplash.com/photo-1587202372579-22f3c70624bc?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Monitors',
    slug: 'monitors-and-displays',
    query: 'monitor',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'View All',
    slug: 'all',
    isViewAll: true,
  },
];

// Curated Best Deals Hardware Products
const curatedBestDeals = [
  {
    _id: 'deal-gpu-4070',
    name: 'ZOTAC Gaming GeForce RTX 4070 Twin Edge 12GB',
    slug: 'zotac-gaming-geforce-rtx-4070-twin-edge-12gb',
    sellingPrice: 54990,
    mrp: 62500,
    discount: 12,
    rating: 4.6,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'deal-mobo-b650',
    name: 'GIGABYTE B650 Gaming X AX Motherboard',
    slug: 'gigabyte-b650-gaming-x-ax-motherboard',
    sellingPrice: 15499,
    mrp: 16999,
    discount: 9,
    rating: 4.5,
    reviewsCount: 96,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'deal-ram-crucial',
    name: 'Crucial 16GB (8GBx2) DDR5 5600MHz RAM',
    slug: 'crucial-16gb-ddr5-5600mhz-ram',
    sellingPrice: 4799,
    mrp: 5299,
    discount: 10,
    rating: 4.7,
    reviewsCount: 212,
    image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'deal-ssd-990pro',
    name: 'Samsung 990 PRO 1TB NVMe M.2 SSD',
    slug: 'samsung-990-pro-1tb-nvme-m2-ssd',
    sellingPrice: 8999,
    mrp: 10499,
    discount: 14,
    rating: 4.8,
    reviewsCount: 311,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80',
  },
];

// Curated New Arrivals Hardware Products
const curatedNewArrivals = [
  {
    _id: 'arrival-monitor-msi',
    name: 'MSI G274QPF 27" 2K 180Hz IPS Monitor',
    slug: 'msi-g274qpf-27-2k-180hz-ips-monitor',
    sellingPrice: 21999,
    rating: 4.6,
    reviewsCount: 64,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'arrival-cooler-ak620',
    name: 'DeepCool AK620 CPU Air Cooler',
    slug: 'deepcool-ak620-cpu-air-cooler',
    sellingPrice: 6499,
    rating: 4.8,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'arrival-case-gt502',
    name: 'ASUS TUF Gaming GT502 Case',
    slug: 'asus-tuf-gaming-gt502-case',
    sellingPrice: 11999,
    rating: 4.7,
    reviewsCount: 45,
    image: 'https://images.unsplash.com/photo-1587202372579-22f3c70624bc?w=500&auto=format&fit=crop&q=80',
  },
  {
    _id: 'arrival-cpu-14700k',
    name: 'Intel Core i7-14700K 14th Gen Processor',
    slug: 'intel-core-i7-14700k-14th-gen-processor',
    sellingPrice: 28999,
    rating: 4.8,
    reviewsCount: 133,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80',
  },
];

const topBrandNames = [
  'ASUS', 'msi', 'GIGABYTE', 'acer', 'Lenovo', 'DELL', 
  'LG', 'SAMSUNG', 'crucial', 'Western Digital', 'CORSAIR'
];

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const formatPrice = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

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

            <p className="text-slate-300 text-xs md:text-sm max-w-md font-normal leading-relaxed">
              Premium hardware. Trusted brands. Unmatched performance.
            </p>

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
      {/* 3. HARDWARE CATEGORIES (10 Rounded Cards Carousel)                        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3 text-center">
          {hardwareCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.isViewAll ? '/categories' : `/products?category=${cat.slug}&q=${cat.query || ''}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-2.5 flex flex-col items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-2xs"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center overflow-hidden mb-1.5 p-1 bg-slate-50">
                {cat.isViewAll ? (
                  <LayoutGrid className="w-7 h-7 text-slate-800 group-hover:text-[#F5B400] transition-colors" />
                ) : (
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-700 transition-colors truncate w-full">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DUAL SHELVES: BEST DEALS & NEW ARRIVALS                                 */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT SHELF: BEST DEALS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight uppercase">
              BEST DEALS
            </h3>
            <Link 
              to="/deals" 
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
            {curatedBestDeals.map((prod) => (
              <Link
                key={prod._id}
                to={`/product/${prod.slug}`}
                className="bg-white border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md transition-all group relative text-left"
              >
                <div>
                  {/* Top discount tag & wishlist */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      {prod.discount}% OFF
                    </span>
                    <Heart className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors" />
                  </div>

                  {/* Product Image */}
                  <div className="h-24 w-full flex items-center justify-center p-1 mb-2 bg-slate-50/50 rounded-lg">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Title */}
                  <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-700 transition-colors">
                    {prod.name}
                  </h4>
                </div>

                {/* Price & Rating */}
                <div className="mt-2 pt-1.5 border-t border-slate-100">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xs font-black text-slate-950">
                      {formatPrice(prod.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatPrice(prod.mrp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-1">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-slate-700">{prod.rating}</span>
                    <span>({prod.reviewsCount})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT SHELF: NEW ARRIVALS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight uppercase">
              NEW ARRIVALS
            </h3>
            <Link 
              to="/new-arrivals" 
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
            {curatedNewArrivals.map((prod) => (
              <Link
                key={prod._id}
                to={`/product/${prod.slug}`}
                className="bg-white border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md transition-all group relative text-left"
              >
                <div>
                  {/* Wishlist only */}
                  <div className="flex justify-end mb-1.5">
                    <Heart className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors" />
                  </div>

                  {/* Product Image */}
                  <div className="h-24 w-full flex items-center justify-center p-1 mb-2 bg-slate-50/50 rounded-lg">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Title */}
                  <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-700 transition-colors">
                    {prod.name}
                  </h4>
                </div>

                {/* Price & Rating */}
                <div className="mt-2 pt-1.5 border-t border-slate-100">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xs font-black text-slate-950">
                      {formatPrice(prod.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-1">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-slate-700">{prod.rating}</span>
                    <span>({prod.reviewsCount})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. TOP BRANDS STRIP                                                        */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          
          <div className="bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 border border-slate-200/60">
            TOP BRANDS
          </div>

          <div className="flex items-center space-x-8 md:space-x-10 overflow-x-auto no-scrollbar py-1">
            {topBrandNames.map((brandName, idx) => (
              <Link
                key={idx}
                to={`/brand/${brandName.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-slate-600 hover:text-slate-950 font-black text-sm uppercase tracking-wider hover:scale-105 transition-all shrink-0 select-none"
              >
                {brandName}
              </Link>
            ))}
          </div>

          <button 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 text-slate-700 transition-colors"
            title="Next Brands"
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
