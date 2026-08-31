import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, Edit3, Trash2, ShieldCheck, Clock, ShieldX, Search, Filter, 
  ChevronLeft, ChevronRight, Eye, Archive, Package, ArrowUpDown, AlertTriangle
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandSellerService.getProducts({
        search,
        status,
        sort,
        page,
        limit: 10,
      });
      if (res.success) {
        setProducts(res.products || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching seller products:', err);
      setError('Unable to load product listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, status, sort, page]);

  // Sync search input with URL params on submit/delay
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Are you sure you want to archive "${name}"? It will be deactivated from the public marketplace.`)) return;
    try {
      const res = await brandSellerService.deleteProduct(id);
      if (res.success) {
        fetchProducts();
      }
    } catch (err) {
      alert('Error archiving product.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      
      {/* 1. Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">Product Catalog Management</h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Manage your hardware inventory, dynamic specifications, and platform listings.
          </p>
        </div>
        <Link to="/brand/products/new">
          <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Button>
        </Link>
      </div>

      {/* 2. Search, Filter & Sort Controls */}
      <div className="bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by product name, SKU, or model..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-brand-light border border-brand-gray-250 pl-9 pr-4 py-2 rounded-sm text-xs focus:ring-0 focus:border-brand-accent placeholder:text-brand-gray-400 font-medium"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray-400 pointer-events-none" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Status:</span>
            <select
              value={status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:ring-0 focus:border-brand-accent uppercase tracking-wider"
            >
              <option value="all">All Status</option>
              <option value="Approved">Published</option>
              <option value="Pending Approval">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-brand-gray-400 uppercase">Sort:</span>
            <select
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="bg-brand-light border border-brand-gray-250 text-xs font-bold py-1.5 px-3 rounded-sm text-brand-gray-800 focus:ring-0 focus:border-brand-accent uppercase tracking-wider"
            >
              <option value="newest">Newest First</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="stockLow">Stock: Low to High</option>
              <option value="nameAsc">Name: A to Z</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Catalog Table */}
      {loading ? (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium p-6 space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-4">
          <Package className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">Your product catalog is empty</h3>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
            {search || status !== 'all' ? 'No products match your current search and filter parameters.' : 'Publish your first high-performance technology listing to start receiving customer orders.'}
          </p>
          <Link to="/brand/products/new">
            <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider">
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">SKU / Model</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {products.map((p) => {
                  const primaryImg = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200';
                  const isLowStock = (p.stock.quantity - (p.stock.reservedQuantity || 0)) <= (p.stock.reorderThreshold || 4);

                  return (
                    <tr key={p._id} className="hover:bg-brand-gray-50/70 transition-colors">
                      {/* Product image & name */}
                      <td className="px-5 py-3.5 flex items-center space-x-3 max-w-[240px]">
                        <div className="w-11 h-11 rounded border bg-brand-light p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img src={primaryImg} alt="" className="object-cover h-full w-full rounded-sm" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-brand-gray-900 truncate block text-xs" title={p.name}>
                            {p.name}
                          </span>
                          <span className="text-[10px] text-brand-gray-400 block truncate">
                            {p.shortDescription || 'Brand Hardware Listing'}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="font-bold text-brand-accent">{p.SKU}</span>
                        <p className="text-[10px] text-brand-gray-400 mt-0.5">{p.modelNumber}</p>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5 font-semibold text-brand-gray-650">
                        {p.category?.name || 'General Electronics'}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 text-right">
                        <p className="font-black text-brand-gray-900">₹{p.sellingPrice.toLocaleString('en-IN')}</p>
                        {p.mrp > p.sellingPrice && (
                          <p className="text-[10px] text-brand-gray-400 line-through">₹{p.mrp.toLocaleString('en-IN')}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3.5">
                        <span className={`font-black text-xs ${isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {p.stock.quantity} Units
                        </span>
                        <p className="text-[10px] text-brand-gray-400 mt-0.5">
                          Avail: {Math.max(0, p.stock.quantity - (p.stock.reservedQuantity || 0))}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          p.status === 'Archived' ? 'bg-brand-gray-100 text-brand-gray-600 border border-brand-gray-300' :
                          p.status === 'Draft' ? 'bg-brand-gray-100 text-brand-gray-700 border border-brand-gray-300' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.status === 'Approved' && <ShieldCheck className="w-3 h-3 mr-0.5" />}
                          {p.status === 'Pending Approval' && <Clock className="w-3 h-3 mr-0.5" />}
                          <span>{p.status === 'Approved' ? 'Published' : p.status}</span>
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td className="px-5 py-3.5 text-[11px] text-brand-gray-500 font-medium whitespace-nowrap">
                        {new Date(p.updatedAt || p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center space-x-1.5 whitespace-nowrap">
                        <Link
                          to={`/product/${p.slug}`}
                          target="_blank"
                          title="View on Storefront"
                          className="inline-block p-1.5 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/brand/products/edit/${p._id}`}
                          title="Edit Listing"
                          className="inline-block p-1.5 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 hover:text-brand-accent transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleArchive(p._id, p.name)}
                          title="Archive Listing"
                          className="p-1.5 border border-brand-gray-200 rounded hover:bg-red-50 text-brand-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-brand-gray-200 bg-brand-light flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-gray-600 font-semibold">
            <span>
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} listings
            </span>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="text-xs uppercase font-bold px-2.5 py-1"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                <span>Prev</span>
              </Button>
              
              <span className="px-3 py-1 font-black text-brand-gray-900 bg-white border rounded">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="text-xs uppercase font-bold px-2.5 py-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
