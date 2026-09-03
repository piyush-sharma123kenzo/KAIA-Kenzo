import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, PackageOpen, LayoutDashboard, Truck, Layers, 
  Landmark, Users2, ShieldAlert, LogOut, FileText, ShieldCheck, 
  RotateCcw, TrendingUp, DollarSign, CreditCard, Tag, Sparkles, 
  Activity, Radio, BarChart3, Menu, X, ExternalLink, QrCode,
  Search, ChevronRight, PlusCircle, Bell, ChevronLeft, Store,
  Zap, ArrowUpRight, Cpu, Headphones, MessageSquare, MapPin
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import KaiaIcon from '../components/common/KaiaIcon';
import ProfileAvatar from '../components/profile/ProfileAvatar';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    if (path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
      return true;
    }
    return location.pathname === path;
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, badge: null },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, badge: null },
      ],
    },
    {
      group: 'PRODUCTS & CATALOG',
      items: [
        { name: 'All Products', path: '/admin/products', icon: PackageOpen, badge: null },
        { name: 'Add Product', path: '/admin/products/add', icon: PlusCircle, badge: 'New' },
        { name: 'Categories', path: '/admin/categories', icon: Layers, badge: null },
        { name: 'Brands', path: '/admin/brands', icon: Building2, badge: null },
      ],
    },
    {
      group: 'LOGISTICS & OPERATIONS',
      items: [
        { name: 'Delivery Management', path: '/admin/delivery-locations', icon: MapPin, badge: '10 KM' },
        { name: 'Shipments & Logistics', path: '/admin/shipments', icon: Truck, badge: null },
        { name: 'Warehouse Inventory', path: '/admin/inventory', icon: Layers, badge: null },
        { name: 'Physical Serials', path: '/admin/serials', icon: QrCode, badge: null },
        { name: 'RMA / Returns', path: '/admin/returns', icon: RotateCcw, badge: null },
      ],
    },
    {
      group: 'CUSTOMER CARE & INQUIRIES',
      items: [
        { name: 'Support Tickets', path: '/admin/support-tickets', icon: Headphones, badge: null },
        { name: 'Direct Supply Inquiries', path: '/admin/enquiries', icon: MessageSquare, badge: null },
      ],
    },
    {
      group: 'FINANCE & PAYOUTS',
      items: [
        { name: 'Revenue Analytics', path: '/admin/revenue', icon: TrendingUp, badge: null },
        { name: 'Commission Rules', path: '/admin/commissions', icon: Landmark, badge: null },
        { name: 'Seller Settlements', path: '/admin/settlements', icon: DollarSign, badge: null },
        { name: 'Payment Ledger', path: '/admin/payments', icon: CreditCard, badge: null },
      ],
    },
    {
      group: 'MARKETING',
      items: [
        { name: 'Discount Coupons', path: '/admin/coupons', icon: Tag, badge: null },
        { name: 'Promotions', path: '/admin/promotions', icon: Sparkles, badge: null },
      ],
    },
    {
      group: 'SYSTEM & SECURITY',
      items: [
        { name: 'Accounts & Users', path: '/admin/users', icon: Users2, badge: null },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck, badge: null },
        { name: 'Reports & Exports', path: '/admin/reports', icon: FileText, badge: null },
        { name: 'Webhooks Monitor', path: '/admin/webhooks', icon: Radio, badge: null },
        { name: 'System Diagnostics', path: '/admin/system-health', icon: Activity, badge: null },
      ],
    },
  ];

  // Get current active breadcrumb
  const getCurrentSection = () => {
    for (const sec of navSections) {
      for (const item of sec.items) {
        if (isActive(item.path)) return { group: sec.group, name: item.name };
      }
    }
    if (location.pathname.startsWith('/admin/products/edit')) return { group: 'PRODUCTS & CATALOG', name: 'Edit Product' };
    return { group: 'OVERVIEW', name: 'Dashboard' };
  };

  const currentSection = getCurrentSection();

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 p-8 rounded-2xl shadow-2xl text-center text-white backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-2 uppercase">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            The KAIA Central Command Center is strictly reserved for verified marketplace administrators.
          </p>
          <div className="space-y-3">
            <Link 
              to="/login" 
              className="block w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 uppercase tracking-wider"
            >
              Sign In to Admin Console
            </Link>
            <Link 
              to="/" 
              className="block text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden antialiased text-slate-900 selection:bg-amber-500/30 selection:text-amber-900">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. PREMIUM SIDEBAR                                                        */}
      {/* ========================================================================= */}
      <aside className={`fixed lg:static inset-y-0 left-0 ${
        collapsed ? 'w-20' : 'w-64'
      } bg-[#0A0F1D] text-slate-300 flex flex-col justify-between border-r border-slate-800/70 z-50 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none shrink-0 ${
        mobileOpen ? 'translate-x-0 !w-72' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Logo Header */}
          <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080C18]">
            <Link to="/admin/dashboard" className="flex items-center space-x-3 overflow-hidden group">
              <div className="shrink-0 group-hover:scale-105 transition-transform">
                <KaiaIcon size={34} variant="dark" glow={true} animated={false} />
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="transition-opacity duration-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-white tracking-tight leading-none">KAIA</span>
                    <span className="text-[10px] px-1.5 py-0.2 font-black rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      CENTRAL
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                    Command Center
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileOpen(false)} 
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Menu Scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 text-left">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 py-1 block">
                    {sec.group}
                  </span>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={collapsed && !mobileOpen ? item.name : undefined}
                      className={`group relative flex items-center ${
                        collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'space-x-3 px-3 py-2'
                      } rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                        active ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                      }`} />
                      
                      {(!collapsed || mobileOpen) && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              active 
                                ? 'bg-slate-950/20 text-slate-950' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar */}
                      {active && (!collapsed || mobileOpen) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Area: Storefront Link & Admin Profile */}
          <div className="p-3 border-t border-slate-800/80 bg-[#080C18] space-y-2 shrink-0 text-left">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center ${
                collapsed && !mobileOpen ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all border border-slate-800/40`}
            >
              {(!collapsed || mobileOpen) && (
                <div className="flex items-center space-x-2">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>Public Storefront</span>
                </div>
              )}
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Admin Info & Sign Out */}
            <div className={`p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/60 flex items-center ${
              collapsed && !mobileOpen ? 'justify-center' : 'justify-between'
            }`}>
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                  {user.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                {(!collapsed || mobileOpen) && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate leading-tight">{user.name || 'Admin'}</p>
                    <span className="text-[10px] text-amber-400/90 font-mono block truncate">Super Administrator</span>
                  </div>
                )}
              </div>

              {(!collapsed || mobileOpen) && (
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA WITH ENTERPRISE TOP BAR                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top App Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex justify-between items-center z-20 shrink-0 shadow-xs">
          
          {/* Left: Collapse Toggle & Breadcrumbs */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* Breadcrumb Navigation */}
            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-400">KAIA Central</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">{currentSection.group}</span>
              <span className="text-slate-300">/</span>
              <span className="font-extrabold text-slate-900">{currentSection.name}</span>
            </div>
          </div>
          
          {/* Right: Quick Actions & Live Indicator */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* System Live Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>System Live</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-[10px] text-emerald-700 font-medium font-mono">Live Sync</span>
            </div>

            {/* Quick Action: Add Product */}
            <Link 
              to="/admin/products/add" 
              className="hidden sm:inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>

            {/* Diagnostics Link */}
            <Link 
              to="/admin/system-health" 
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="System Diagnostics"
            >
              <Activity className="w-4 h-4" />
            </Link>

            {/* Admin Avatar */}
            <ProfileAvatar 
              user={user} 
              size="sm" 
              shape="rounded" 
              ring={true}
              ringColor="ring-slate-300/80"
              allowPreview={Boolean(user?.profileImage?.url || user?.avatar)}
              className="shadow-xs cursor-pointer"
            />
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
