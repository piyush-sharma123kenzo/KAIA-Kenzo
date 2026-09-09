import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusCircle, ShoppingBag, Barcode, Truck, ClipboardList, TrendingUp, Building2, Settings, Bell, LogOut, ShieldAlert, Menu, X, CheckCircle, ExternalLink, FileText, RotateCcw, Landmark, DollarSign,
  ChevronDown, ChevronRight, User, ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import KaiaIcon from '../components/common/KaiaIcon';
import ProfileAvatar from '../components/profile/ProfileAvatar';

const BrandLayout = () => {
  const { user, brand, logout } = useContext(AuthContext);
  const { unreadCount = 0 } = useNotifications() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isVendorPath = location.pathname.startsWith('/vendor');
  const basePath = isVendorPath ? '/vendor' : '/brand';

  const isActive = (path) => {
    const fullPath = path.startsWith('/') ? path : `${basePath}/${path}`;
    const dashPath = `${basePath}/dashboard`;
    if ((path === '/dashboard' || path === dashPath) && (location.pathname === basePath || location.pathname === `${basePath}/` || location.pathname === dashPath)) {
      return true;
    }
    return location.pathname === fullPath || (path !== '/dashboard' && location.pathname.startsWith(fullPath));
  };

  const menuItems = [
    { name: 'Overview', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { name: 'Products', path: `${basePath}/products`, icon: Package },
    { name: 'Add Product', path: `${basePath}/products/new`, icon: PlusCircle },
    { name: 'Warehouse Inventory', path: `${basePath}/inventory`, icon: ClipboardList },
    { name: 'Fulfillment & Packing', path: `${basePath}/fulfillment`, icon: Barcode },
    { name: 'Seller Orders', path: `${basePath}/orders`, icon: ShoppingBag },
    { name: 'Shipments & Logistics', path: `${basePath}/shipments`, icon: Truck },
    { name: 'Invoices & GST', path: `${basePath}/invoices`, icon: FileText },
    { name: 'Returns & RMA', path: `${basePath}/returns`, icon: RotateCcw },
    { name: 'Earnings & Ledger', path: `${basePath}/earnings`, icon: DollarSign },
    { name: 'Settlements', path: `${basePath}/settlements`, icon: Landmark },
    { name: 'Brand Profile', path: `${basePath}/profile`, icon: Building2 },
    { name: 'Settings', path: `${basePath}/settings`, icon: Settings },
  ];

  const role = (user?.role || '').toUpperCase();
  if (!user || (role !== 'BRAND' && role !== 'VENDOR' && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-premium border border-brand-gray-200 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-brand-accent mx-auto" />
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Partner Access Denied</h2>
          <p className="text-xs text-brand-gray-600 leading-relaxed">
            Only authorized KAIA brand and vendor partner accounts can view this dashboard. Please sign in with authorized partner credentials.
          </p>
          <div className="space-y-2 pt-2">
            <Link to="/login" className="block w-full bg-brand-dark text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-brand-gray-800 transition-colors">
              Sign In to Partner Hub
            </Link>
            <Link to="/" className="block text-xs text-brand-accent font-bold hover:underline">
              Back to Marketplace Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle brand approval pending state
  if (brand && brand.status !== 'Approved' && !brand.isApproved) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-brand-surface p-8 rounded-sm border border-brand-gray-850 text-center space-y-6 shadow-premiumDark">
          <div className="inline-block p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight uppercase">Your brand account is awaiting approval.</h2>
            <p className="text-xs text-brand-gray-400 max-w-md mx-auto leading-relaxed">
              Your registration for <span className="font-bold text-white">{brand.name}</span> is currently under review by KAIA platform compliance. You will receive an email once your GSTIN & bank credentials are authenticated.
            </p>
          </div>
          <div className="p-4 bg-brand-dark border border-brand-gray-850 rounded text-left text-xs text-brand-gray-300 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-brand-gray-500">Status:</span>
              <span className="text-amber-400 font-bold uppercase">{brand.status || 'Pending'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-gray-500">Brand Name:</span>
              <span className="text-white font-bold">{brand.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-gray-500">Registered Email:</span>
              <span className="text-white">{user.email}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-brand-gray-850 flex justify-between items-center text-xs">
            <button onClick={logout} className="text-brand-gray-400 hover:text-white transition-colors uppercase font-bold">
              Sign Out
            </button>
            <Link to="/" className="text-brand-accent hover:underline font-bold uppercase">
              Return to Customer Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-gray-50 font-sans overflow-hidden text-brand-gray-900">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-brand-dark text-brand-gray-300 flex flex-col justify-between border-r border-brand-gray-850 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="p-6 border-b border-brand-gray-850 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="shrink-0">
                <KaiaIcon size={32} variant="dark" glow={true} />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-black text-white tracking-tight leading-none uppercase">KAIA PARTNER</h2>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-[10px] text-brand-accent font-bold uppercase truncate max-w-[120px]">
                    {brand?.name || 'Authorized Seller'}
                  </span>
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-brand-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-bold transition-all uppercase tracking-wider ${
                    active
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-brand-gray-400 hover:bg-brand-gray-850 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="p-4 border-t border-brand-gray-850 space-y-1.5">
            <Link
              to={brand?.slug ? `/brand/${brand.slug}` : '/products'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-3.5 py-2 rounded-sm text-[11px] font-bold hover:bg-brand-gray-850 text-brand-gray-400 hover:text-white uppercase tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-sm text-[11px] font-bold hover:bg-red-950/40 text-red-400 uppercase tracking-wider transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Partner</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-brand-gray-200 px-4 md:px-8 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded hover:bg-brand-gray-100 text-brand-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base md:text-lg font-black text-brand-gray-900 uppercase tracking-tight">
                {menuItems.find((m) => isActive(m.path))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Direct Link to Add Product CTA */}
            <Link
              to={`${basePath}/products/new`}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-brand-dark hover:bg-brand-gray-800 text-white px-3.5 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-brand-accent" />
              <span>New Listing</span>
            </Link>

            {/* Brand Notifications */}
            <Link
              to={`${basePath}/notifications`}
              className="p-2 rounded-sm hover:bg-brand-gray-100 text-brand-gray-600 hover:text-brand-gray-900 transition-colors relative"
              title="Brand Notifications"
              aria-label={`Brand Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center leading-none ring-2 ring-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Operator details with Interactive Account Dropdown */}
            <div 
              className="relative border-l border-brand-gray-200 pl-3 sm:pl-4"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-left focus:outline-none group p-1 rounded-sm hover:bg-brand-gray-50 transition-colors cursor-pointer"
              >
                <ProfileAvatar 
                  user={user} 
                  size="sm" 
                  shape="circle" 
                  ring={true}
                  ringColor="ring-amber-500/40"
                  allowPreview={false}
                  showRoleBadge={false}
                />
                <div className="text-left hidden md:block">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold text-brand-gray-900 leading-none group-hover:text-amber-600 transition-colors">
                      {brand?.name || user.name}
                    </p>
                    <ChevronDown className="w-3 h-3 text-brand-gray-400 group-hover:text-brand-gray-700 transition-transform" />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Authorized Seller</p>
                </div>
              </button>

              {/* Account Options Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full pt-2 w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                  <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-200 overflow-hidden ring-1 ring-black/5">
                    
                    {/* Header Details */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center space-x-3">
                      <ProfileAvatar 
                        user={user} 
                        size="md" 
                        shape="circle" 
                        ring={true}
                        ringColor="ring-amber-500"
                        allowPreview={true}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{brand?.name || user.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {brand?.status || 'Authorized Seller'}
                        </span>
                      </div>
                    </div>

                    {/* Nav Action Links */}
                    <div className="p-2 space-y-0.5 text-xs">
                      <Link
                        to={`${basePath}/profile`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="flex-1">Brand Store Profile</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>

                      <Link
                        to={`${basePath}/inventory`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors"
                      >
                        <ClipboardList className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="flex-1">Warehouse Inventory</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>

                      <Link
                        to={`${basePath}/settlements`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors"
                      >
                        <Landmark className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="flex-1">Earnings & Payouts</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>

                      <Link
                        to={`${basePath}/settings`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="flex-1">Partner Settings</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>

                      <Link
                        to={brand?.slug ? `/brand/${brand.slug}` : '/products'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-amber-800 hover:text-amber-950 hover:bg-amber-50 font-semibold transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="flex-1">Customer Storefront</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </Link>
                    </div>

                    {/* Sign Out Footer */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Partner Account</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dashboard Content scrolling wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-light">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default BrandLayout;
