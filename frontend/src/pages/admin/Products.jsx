import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit3, Trash2, ExternalLink, Filter, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, Trophy, 
  Zap, ArrowUpDown, RefreshCw, Layers, Tag
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
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
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* 1. Header with Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <Layers className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, update pricing & stock, upload multi-angle photos, and publish hardware live to the KAIA storefront.
          </p>
        </div>

        <Link to="/admin/products/add">
          <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center space-x-2">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Product</span>
          </button>
        </Link>
      </div>

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
          <option value="">All Brands</option>
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
          className="bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active / Live</option>
          <option value="Inactive">Inactive / Draft</option>
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
              Your store catalog is currently empty. Click "Add New Product" to upload and publish your first product!
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
                  <th className="px-4 py-3.5">Brand</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price & MRP</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Flags</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((product) => {
                  const displayImg = product.imageUrl || (product.images?.[0]?.url || product.images?.[0] || '');
                  const isLive = product.status === 'Approved' || product.status === 'published';

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image & Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300';
                                }}
                              />
                            ) : (
                              <Layers className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="max-w-[240px]">
                            <span className="font-extrabold text-slate-900 truncate block text-xs" title={product.name}>
                              {product.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              SKU: {product.SKU || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
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

                      {/* Badges / Flags */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.isFeatured && (
                            <span className="inline-flex items-center text-[9px] font-extrabold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Featured
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="inline-flex items-center text-[9px] font-extrabold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              <Trophy className="w-2.5 h-2.5 mr-0.5" /> Best Seller
                            </span>
                          )}
                          {product.isNewArrival && (
                            <span className="inline-flex items-center text-[9px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              <Zap className="w-2.5 h-2.5 mr-0.5" /> New
                            </span>
                          )}
                          {!product.isFeatured && !product.isBestSeller && !product.isNewArrival && (
                            <span className="text-slate-400 text-[10px]">Standard</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isLive && product.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isLive && product.isActive !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Draft</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Live View */}
                          <Link
                            to={`/product/${product.slug}`}
                            target="_blank"
                            title="View on Storefront"
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            title="Edit Product"
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
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
