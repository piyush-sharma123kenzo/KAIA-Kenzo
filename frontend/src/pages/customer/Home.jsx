import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ShieldCheck, ArrowRight, Star, ShoppingCart, 
  Sparkles, CheckCircle2, Truck, FileText, Cpu, Headphones, 
  Laptop, Smartphone, HardDrive, Monitor, Camera, Zap, 
  Layers, Server, Compass, Shield
} from 'lucide-react';
import productService from '../../services/productService';
import brandService from '../../services/brandService';
import ProductCard from '../../components/product/ProductCard';
import { getAccurateProductImage } from '../../utils/productImageMap';
import { getBrandLogo } from '../../utils/brandLogos';

const fallbackHomeBrands = [
  { name: 'Samsung', slug: 'samsung' },
  { name: 'ASUS', slug: 'asus' },
  { name: 'Dell', slug: 'dell' },
  { name: 'HP', slug: 'hp' },
  { name: 'Lenovo', slug: 'lenovo' },
  { name: 'LG', slug: 'lg' },
  { name: 'Logitech', slug: 'logitech' },
  { name: 'Razer', slug: 'razer' },
  { name: 'Corsair', slug: 'corsair' },
  { name: 'MSI', slug: 'msi' },
  { name: 'Intel', slug: 'intel' },
  { name: 'AMD', slug: 'amd' },
  { name: 'Canon', slug: 'canon' },
  { name: 'Kingston', slug: 'kingston' },
  { name: 'Xiaomi', slug: 'xiaomi' },
];

const Home = () => {
  const [deals, setDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [brands, setBrands] = useState(fallbackHomeBrands);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [dealsRes, bestRes, arrivalRes, brandsRes] = await Promise.all([
          productService.getProducts({ limit: 10, sort: 'price_asc' }),
          productService.getBestSellers(10),
          productService.getNewArrivals(10),
          brandService.getBrands().catch(() => ({ success: false })),
        ]);

        if (dealsRes.success) setDeals(dealsRes.products || []);
        if (bestRes.success) setBestSellers(bestRes.products || []);
        if (arrivalRes.success) setNewArrivals(arrivalRes.products || []);
        if (brandsRes.success && (brandsRes.brands?.length > 0 || brandsRes.data?.length > 0)) {
          setBrands(brandsRes.brands || brandsRes.data);
        }
      } catch (err) {
        console.error('Error loading homepage catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // 4 Featured Hubs for Overlap Cards with realistic, full-product studio photography
  const dealCards = [
    {
      title: 'Laptops & Workstations',
      link: '/products?category=laptops',
      cta: 'See all laptop deals',
      tiles: [
        { title: 'Gaming Laptops', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', query: 'gaming' },
        { title: 'Ultrabooks', img: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80', query: 'laptops' },
        { title: 'ThinkPads', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80', query: 'lenovo' },
        { title: 'Workstations', img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80', query: 'dell' },
      ],
    },
    {
      title: 'Flagships & 5G Phones',
      link: '/products?category=smartphones',
      cta: 'Explore smartphones',
      tiles: [
        { title: 'Flagship 5G', img: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80', query: 'smartphones' },
        { title: 'Foldables', img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80', query: 'foldable' },
        { title: 'OLED Displays', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80', query: 'samsung' },
        { title: 'Smartwatches', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', query: 'watch' },
      ],
    },
    {
      title: 'Studio Audio & Wireless',
      link: '/products?category=audio-and-sound',
      cta: 'Discover audio gear',
      tiles: [
        { title: 'ANC Headphones', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', query: 'headphones' },
        { title: 'True Wireless', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80', query: 'earbuds' },
        { title: 'Studio Monitors', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80', query: 'audio' },
        { title: 'Gaming Headsets', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80', query: 'razer' },
      ],
    },
    {
      title: 'High-End Components & GPUs',
      link: '/products?category=pc-components',
      cta: 'Build custom PC',
      tiles: [
        { title: 'RTX GPUs', img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', query: 'graphics' },
        { title: 'Ryzen CPUs', img: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80', query: 'processor' },
        { title: 'DDR5 RAM', img: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80', query: 'ram' },
        { title: 'NVMe Storage', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', query: 'storage' },
      ],
    },
  ];

  // 6 Verified Category Department Tiles
  const categoryStrip = [
    { name: 'Laptops', slug: 'laptops', icon: Laptop, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80' },
    { name: 'Smartphones', slug: 'smartphones', icon: Smartphone, img: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&auto=format&fit=crop&q=80' },
    { name: 'Headphones', slug: 'audio-and-sound', icon: Headphones, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80' },
    { name: 'PC Components', slug: 'pc-components', icon: Cpu, img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80' },
    { name: 'Gaming Displays', slug: 'monitors-and-displays', icon: Monitor, img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80' },
    { name: 'Cameras', slug: 'cameras-and-imaging', icon: Camera, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80' },
  ];

  // 6 Authorized Manufacturer Hubs with Rich Brand Meta
  const brandChips = [
    { name: 'Nexora Core', tag: 'High-Performance', icon: Cpu, desc: 'Enterprise compute & custom rigs' },
    { name: 'Voltis Audio', tag: 'Acoustics', icon: Headphones, desc: 'Studio grade audiophile equipment' },
    { name: 'Apex Robotics', tag: 'Components', icon: Zap, desc: 'Next-gen semiconductors & boards' },
    { name: 'Helix Gaming', tag: 'Displays & Rigs', icon: Monitor, desc: 'Ultra-refresh competitive monitors' },
    { name: 'Strata Tech', tag: 'Enterprise', icon: Server, desc: 'High-density storage & networking' },
    { name: 'Orbit Gear', tag: 'Peripherals', icon: Layers, desc: 'Precision tactile accessories' },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left select-none pb-20 space-y-12">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER (Modern Dark Gradient with Studio Glow)                    */}
      {/* ========================================================================= */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden pb-36 md:pb-44 pt-12 px-4 md:px-8 shadow-md">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
          <div className="max-w-2xl space-y-5">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Technology from every brand.<br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                One unified marketplace.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 max-w-xl font-normal leading-relaxed">
              Procure authentic hardware directly from 16+ authorized electronics brand warehouses with verified serial warranties and express delivery.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link to="/deals">
                <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm px-6 py-3 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all">
                  Shop Featured Deals
                </button>
              </Link>
              <Link to="/categories">
                <button className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs md:text-sm px-5 py-3 rounded-lg border border-white/20 backdrop-blur-sm transition-all">
                  Explore All Departments
                </button>
              </Link>
            </div>
          </div>


        </div>

        {/* Smooth fade into background */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F8FAFC] to-transparent pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. SIGNATURE OVERLAP DEALS ROW (4 Elevated Modern Cards)                  */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 md:-mt-32 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealCards.map((card, cardIdx) => (
            <div
              key={cardIdx}
              className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-200/80 hover:border-amber-400/50 flex flex-col justify-between group/card hover:-translate-y-1.5"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-[17px] text-slate-900 tracking-tight leading-snug">
                    {card.title}
                  </h3>
                </div>

                {/* 2x2 Grid of Product Tiles */}
                <div className="grid grid-cols-2 gap-3.5 mb-2">
                  {card.tiles.map((tile, i) => (
                    <Link
                      key={i}
                      to={`/products?search=${tile.query}`}
                      className="group/tile flex flex-col text-left"
                    >
                      <div className="tile-image-container border border-slate-100 group-hover/tile:border-amber-400/60 group-hover/tile:bg-amber-50/20 group-hover/tile:shadow-sm transition-all duration-300 mb-2">
                        <img
                          src={tile.img}
                          alt={tile.title}
                          className="filter drop-shadow-sm group-hover/tile:scale-110 transition-transform duration-300 select-none pointer-events-none"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover/tile:text-amber-600 transition-colors">
                        {tile.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <Link
                to={card.link}
                className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
              >
                <span>{card.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. POPULAR CATEGORIES STRIP (Elevated 6-Column Department Cards)          */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-white p-7 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Explore Popular Departments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Direct manufacturer warranty & express shipping</p>
            </div>
            <Link to="/categories" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1">
              <span>View All Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categoryStrip.map((cat) => {
              const Icon = cat.icon || Laptop;
              return (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="group bg-slate-50 hover:bg-amber-500/10 border border-slate-200/80 hover:border-amber-400 p-4 rounded-xl text-center transition-all duration-200 block space-y-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center mx-auto group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-200 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 block transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FEATURED PRODUCTS (Minimal, Clean Product Showcase)                   */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-7 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <Link to="/products" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1">
              <span>View All Products</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              Product catalog is being updated with fresh inventory.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {deals.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPLORE TOP BRANDS (Shop by Brand)                                     */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-7 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Explore Top Brands
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Discover products from the world's leading technology brands</p>
            </div>
            <Link to="/brands" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1">
              <span>View All Brands</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3.5">
            {brands.slice(0, 16).map((brand, idx) => {
              const logo = getBrandLogo(brand);
              const brandSlug = brand.slug || brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <Link
                  key={brand._id || brand.id || idx}
                  to={`/products?brand=${brandSlug}`}
                  className="bg-[#F8FAFC] hover:bg-white border border-slate-100 hover:border-amber-400/60 p-3 rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-between text-center group"
                >
                  <div className="w-12 h-12 flex items-center justify-center p-2 mb-2">
                    <img
                      src={logo}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
                      }}
                    />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-amber-700 transition-colors block truncate w-full">
                    {brand.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. PRODUCT GRID 2: BEST SELLERS (5-Column Grid)                           */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-7 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Best Sellers in Electronics & PC Hardware
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Top-rated genuine products by verified buyers</p>
            </div>
            <Link to="/best-sellers" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1">
              <span>See All Best Sellers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-72 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              Best sellers list will update as orders are placed.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {bestSellers.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. PRODUCT GRID 3: NEW ARRIVALS (5-Column Grid)                            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-7 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                New Arrivals from Verified Brands
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Freshly stocked manufacturer inventory</p>
            </div>
            <Link to="/new-arrivals" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1">
              <span>Explore New Arrivals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-72 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : newArrivals.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              New arrivals will appear here once published from the admin panel.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {newArrivals.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. TRUST & VALUE PILLARS (Modern 4-Column Feature Grid)                    */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 space-y-2.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="font-bold text-sm text-slate-900">100% Verified Brands</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct procurement and stock fulfilled only by authorized manufacturer depots.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 space-y-2.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="font-bold text-sm text-slate-900">Multi-Brand Order Splitting</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              One unified checkout with individual brand shipment tracking and serial allocation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 space-y-2.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="font-bold text-sm text-slate-900">Fast Tracked Delivery</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Insured courier dispatches with end-to-end milestone tracking and SMS notifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 space-y-2.5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h4 className="font-bold text-sm text-slate-900">Official Brand Warranty</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every unit mapped with authentic IMEI/Serial barcodes eligible for official service center support.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Home;
