import React, { useContext, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, PlusCircle, ShoppingBag, Barcode, Truck, ClipboardList, 
  TrendingUp, Building2, Settings, Bell, LogOut, ShieldAlert, Menu, X, CheckCircle, 
  ExternalLink, FileText, RotateCcw, Landmark, DollarSign, ChevronRight
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
    { name: 'Inventory', path: `${basePath}/inventory`, icon: ClipboardList },
    { name: 'Fulfillment', path: `${basePath}/fulfillment`, icon: Barcode },
    { name: 'Orders', path: `${basePath}/orders`, icon: ShoppingBag },
    { name: 'Shipments', path: `${basePath}/shipments`, icon: Truck },
    { name: 'Invoices', path: `${basePath}/invoices`, icon: FileText },
    { name: 'Returns', path: `${basePath}/returns`, icon: RotateCcw },
    { name: 'Earnings', path: `${basePath}/earnings`, icon: DollarSign },
    { name: 'Settlements', path: `${basePath}/settlements`, icon: Landmark },
    { name: 'Brand Profile', path: `${basePath}/profile`, icon: Building2 },
    { name: 'Settings', path: `${basePath}/settings`, icon: Settings },
  ];

  const role = (user?.role || '').toUpperCase();
  if (!user || (role !== 'BRAND' && role !== 'VENDOR' && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Partner Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Only authorized brand and vendor accounts can access this portal. Please sign in with your partner credentials.
          </p>
          <div className="space-y-2 pt-2">
            <Link to="/login" className="block w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 px-4 text-xs font-bold rounded-xl transition-colors">
              Sign In to Partner Portal
            </Link>
            <Link to="/" className="block text-xs text-slate-400 hover:text-white font-medium transition-colors">
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle brand approval pending state
  if (brand && brand.status !== 'Approved' && !brand.isApproved) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="inline-block p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-8 h-8 mx-auto" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight">Account Under Verification</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Your partner registration for <span className="font-semibold text-white">{brand.name}</span> is currently being verified by compliance.
            </p>
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className="text-amber-400 font-bold uppercase">{brand.status || 'Pending'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Brand</span>
              <span className="text-white font-semibold">{brand.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="text-white">{user.email}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <button onClick={logout} className="text-slate-400 hover:text-white transition-colors font-medium">
              Sign Out
            </button>
            <Link to="/" className="text-amber-400 hover:underline font-semibold">
              Marketplace Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden text-slate-100">
      
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <KaiaIcon size={26} variant="dark" glow={true} />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-bold text-white tracking-wider uppercase">KAIA PARTNER</h2>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[130px]">
                    {brand?.name || user.name || 'Store Operations'}
                  </span>
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-3 space-y-1 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="p-3 border-t border-slate-800/80 space-y-1">
            <Link
              to={brand?.slug ? `/brand/${brand.slug}` : '/products'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Customer Storefront</span>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-950">
        
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold hidden sm:inline">Partner Hub</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                {menuItems.find((m) => isActive(m.path))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Quick Add Product CTA */}
            <Link
              to={`${basePath}/products/new`}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>

            {/* Brand Notifications */}
            <Link
              to={`${basePath}/notifications`}
              className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none ring-2 ring-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Operator details */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 sm:pl-4">
              <ProfileAvatar 
                user={user} 
                size="sm" 
                shape="circle" 
                ring={true}
                ringColor="ring-amber-500/30"
                allowPreview={Boolean(user?.profileImage?.url || user?.avatar)}
                showRoleBadge={false}
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-none">{brand?.name || user.name}</p>
                <p className="text-[10px] text-emerald-400 font-medium mt-1">Verified Partner</p>
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content scrolling wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0B0F17]">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default BrandLayout;
