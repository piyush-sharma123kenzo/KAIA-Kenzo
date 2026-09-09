import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit3, Trash2, ExternalLink, Filter, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, Trophy, 
  Zap, ArrowUpDown, RefreshCw, Layers, Tag, Flame,
  Clock, Check, X, Eye, HelpCircle, CheckCheck
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import { getAccurateProductImage } from '../../utils/productImageMap';
import Button from '../../components/ui/Button';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({
        search,
        brand: selectedBrand,
        category: selectedCategory,
        status: selectedStatus,
        page,
        limit: 15,
      });

      if (res.success) {
        setProducts(res.products || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          brandService.getBrands().catch(() => ({ success: false })),
          categoryService.getCategories().catch(() => ({ success: false })),
        ]);
        if (bRes.success) setBrandsList(bRes.brands || bRes.data || []);
        if (cRes.success) setCategoriesList(cRes.categories || cRes.data || []);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [search, selectedBrand, selectedCategory, selectedStatus, page]);

  // Handle Approve Product
  const handleApprove = async (product) => {
    setActionLoadingId(product._id);
    try {
      const res = await adminService.approveProduct(product._id);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id
              ? { ...p, status: 'Approved', isActive: true }
              : p
          )
        );
        showFeedback(`✓ "${product.name}" approved! It is now live on the website storefront.`, 'success');
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to approve product.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Product
  const handleReject = async (product) => {
    const reason = window.prompt(`Please provide a rejection reason for "${product.name}":`, 'Details or pricing need revision.');
    if (reason === null) return; // User cancelled prompt

    setActionLoadingId(product._id);
    try {
      const res = await adminService.rejectProduct(product._id, reason);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id
              ? { ...p, status: 'Rejected', isActive: false }
              : p
          )
        );
        showFeedback(`Product "${product.name}" was marked as Rejected.`, 'info');
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to reject product.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Status Change Dropdown
  const handleStatusChange = async (productId, newStatus) => {
    setActionLoadingId(productId);
    try {
      const res = await adminService.toggleProductStatus(productId, { status: newStatus });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId
              ? { ...p, status: newStatus, isActive: newStatus === 'Approved' || newStatus === 'published' }
              : p
          )
        );
        showFeedback(`Product status changed to ${newStatus}.`, 'success');
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to change status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Merchandising Flag Toggle (Featured, Best Seller, New Arrival, Deal)
  const handleToggleFlag = async (productId, flagName, currentValue) => {
    const nextValue = !currentValue;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, [flagName]: nextValue } : p))
    );

    try {
      const res = await adminService.toggleProductStatus(productId, {
        [flagName]: nextValue,
      });
      if (res.success) {
        const flagLabels = {
          isFeatured: 'Featured',
          isBestSeller: 'Best Seller',
          isNewArrival: 'New Arrival',
          isBestDeal: 'Best Deal',
        };
        showFeedback(
          `${flagLabels[flagName] || flagName} set to ${nextValue ? 'ON ⭐' : 'OFF'} for this product.`,
          'success'
        );
      }
    } catch (err) {
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, [flagName]: currentValue } : p))
      );
      showFeedback(err.response?.data?.message || 'Failed to update flag.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This will remove it from the live store.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await adminService.deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        showFeedback(`Product "${name}" deleted.`, 'info');
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to delete product.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const pendingCount = products.filter((p) => p.status === 'Pending Approval').length;

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-between border transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : toastMessage.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header with Add Action & Pending Alert */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <Layers className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Catalog & Approval Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review vendor submissions, approve products to publish live to the storefront, and configure Best Seller & New Arrival flags.
          </p>
        </div>

        <Link to="/admin/products/add">
          <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center space-x-2">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Product</span>
          </button>
        </Link>
      </div>

      {/* Pending Approval Alert Banner if pending items exist */}
      {pendingCount > 0 && selectedStatus !== 'Pending Approval' && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
              {pendingCount}
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {pendingCount} Vendor Product{pendingCount > 1 ? 's' : ''} Awaiting Approval on this page!
              </p>
              <p className="text-[11px] text-amber-800">
                Click "Approve & Publish" to instantly verify vendor listings and display them live on the KAIA website.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedStatus('Pending Approval');
              setPage(1);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs shrink-0"
          >
            Filter Pending Products →
          </button>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by name, SKU, or model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#F8FAFC] border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Brands / Stores</option>
          {brandsList.map((b) => (
            <option key={b._id || b.slug} value={b.slug || b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Categories</option>
          {categoriesList.map((c) => (
            <option key={c._id || c.slug} value={c.slug || c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Statuses</option>
          <option value="Pending Approval">⏳ Pending Approval</option>
          <option value="Active">✅ Approved / Live</option>
          <option value="Draft">📝 Draft / Inactive</option>
          <option value="Rejected">❌ Rejected</option>
        </select>

        {/* Reset */}
        {(search || selectedBrand || selectedCategory || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedBrand('');
              setSelectedCategory('');
              setSelectedStatus('all');
              setPage(1);
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading catalog inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedStatus === 'Pending Approval'
                ? 'No vendor products are currently awaiting approval.'
                : 'Your store catalog is currently empty. Click "Add New Product" to create one.'}
            </p>
            <Link to="/admin/products/add">
              <Button size="sm" className="bg-amber-500 text-slate-950 font-bold text-xs uppercase">
                Add Product Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Brand / Store</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price & MRP</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Merchandising Flags (Click to Toggle)</th>
                  <th className="px-4 py-3.5">Status & Approval</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((product) => {
                  const displayImg = getAccurateProductImage(product);
                  const isPending = product.status === 'Pending Approval';
                  const isApproved = product.status === 'Approved' || product.status === 'published';
                  const isRejected = product.status === 'Rejected';
                  const isDraft = product.status === 'Draft' || product.status === 'Inactive';
                  const isBusy = actionLoadingId === product._id;

                  return (
                    <tr 
                      key={product._id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPending ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Image & Title */}
                      <td className="px-5 py-4 min-w-[260px] max-w-[320px]">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl bg-[#F8FAFC] border border-slate-200/90 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={product.name}
                                className="w-full h-full max-w-full max-h-full object-contain block"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300';
                                }}
                              />
                            ) : (
                              <Layers className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-slate-900 truncate block text-xs" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              SKU: {product.SKU || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand / Store */}
                      <td className="px-4 py-4">
                        <span className="inline-block font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                          {product.brand?.name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="text-slate-600 font-semibold text-[11px]">
                          {product.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Price & MRP */}
                      <td className="px-4 py-4">
                        <p className="font-extrabold text-slate-900 text-sm">
                          ₹{Number(product.sellingPrice || product.price || 0).toLocaleString('en-IN')}
                        </p>
                        {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
                          <p className="text-[10px] text-slate-400 line-through">
                            ₹{Number(product.mrp).toLocaleString('en-IN')}
                          </p>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-4 py-4">
                        <span
                          className={`font-bold text-xs px-2.5 py-1 rounded-md ${
                            product.stockCount > 5
                              ? 'bg-emerald-50 text-emerald-700'
                              : product.stockCount > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {product.stockCount} in stock
                        </span>
                      </td>

                      {/* Interactive Merchandising Flags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {/* Featured Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(product._id, 'isFeatured', product.isFeatured)}
                            title="Toggle Homepage Featured Showcase"
                            className={`inline-flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${
                              product.isFeatured
                                ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Featured
                          </button>

                          {/* Best Seller Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(product._id, 'isBestSeller', product.isBestSeller)}
                            title="Toggle Best Seller Ribbon & Collection"
                            className={`inline-flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${
                              product.isBestSeller
                                ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            Best Seller
                          </button>

                          {/* New Arrival Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(product._id, 'isNewArrival', product.isNewArrival)}
                            title="Toggle New Arrival Badge & Collection"
                            className={`inline-flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${
                              product.isNewArrival
                                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            New Arrival
                          </button>

                          {/* Best Deal Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(product._id, 'isBestDeal', product.isBestDeal)}
                            title="Toggle Hot Deal Collection"
                            className={`inline-flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${
                              product.isBestDeal
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <Flame className="w-3 h-3 mr-1" />
                            Deal
                          </button>
                        </div>
                      </td>

                      {/* Status & One-Click Approval Workflow */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {/* Current Status Badge */}
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                isApproved && product.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                  : isRejected
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isApproved && product.isActive !== false ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Approved & Live</span>
                                </>
                              ) : isPending ? (
                                <>
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Pending Approval</span>
                                </>
                              ) : isRejected ? (
                                <>
                                  <XCircle className="w-3 h-3 text-red-500" />
                                  <span>Rejected</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 text-slate-400" />
                                  <span>Draft</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Instant Approval Buttons */}
                          {!isApproved ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleApprove(product)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase px-3 py-1.5 rounded-lg shadow-sm hover:shadow-emerald-500/20 transition-all flex items-center space-x-1 disabled:opacity-50"
                                title="Approve this product to publish live to the storefront immediately"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{isBusy ? 'Saving...' : 'Approve & Publish'}</span>
                              </button>

                              {!isRejected && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleReject(product)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject this submission"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <select
                                value={product.status || 'Approved'}
                                onChange={(e) => handleStatusChange(product._id, e.target.value)}
                                disabled={isBusy}
                                className="bg-[#F8FAFC] border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-amber-500"
                              >
                                <option value="Approved">Live (Approved)</option>
                                <option value="Draft">Draft / Hide</option>
                                <option value="Pending Approval">Mark Pending</option>
                                <option value="Rejected">Reject</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Live Storefront View */}
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            title="View Live on Storefront"
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Edit Full Product */}
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            title="Edit Full Product Details"
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Delete Product */}
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            disabled={deletingId === product._id}
                            title="Delete Product"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>
              Showing Page {page} of {totalPages} ({total} Total Products)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminProducts;
