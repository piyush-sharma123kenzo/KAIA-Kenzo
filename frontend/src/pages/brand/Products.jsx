import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, ShieldCheck, Clock, ShieldX } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/products/seller/my-products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product listing? This action is irreversible.')) return;
    try {
      const res = await axiosInstance.delete(`/products/seller/delete/${id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchMyProducts();
      }
    } catch (err) {
      alert('Error deleting product listing.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-brand-gray-900">Your Product Listings</h2>
          <p className="text-xs text-brand-gray-500">Submit, edit, and audit your electronics catalog.</p>
        </div>
        <Link
          to="/brand/products/new"
          className="bg-brand-accent hover:bg-brand-accentHover text-white font-semibold px-4 py-2.5 rounded-sm text-xs flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-brand-gray-500">Loading catalog items...</div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-4">
          <p className="text-sm text-brand-gray-500">Your store has no products listed yet. Click button above to add one.</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
            <thead className="bg-brand-gray-50 uppercase tracking-wider font-semibold text-brand-gray-500">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU / Model</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">MRP / Selling Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-700">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded border bg-brand-gray-50 p-1 flex items-center justify-center shrink-0">
                      <img src={p.images[0]?.url} alt="" className="object-contain max-h-full max-w-full" />
                    </div>
                    <span className="font-bold text-brand-gray-900 truncate max-w-[200px] block">{p.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{p.SKU}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">{p.modelNumber}</p>
                  </td>
                  <td className="px-6 py-4 font-medium capitalize">{p.category?.name || 'Accessories'}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-gray-900">₹{p.sellingPrice.toLocaleString()}</p>
                    <p className="text-[10px] text-brand-gray-400 line-through">₹{p.mrp.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${p.stock.quantity <= p.stock.reorderThreshold ? 'text-red-500 font-bold' : ''}`}>
                      {p.stock.quantity} Units
                    </span>
                    <p className="text-[9px] text-brand-gray-405 mt-0.5">Reserved: {p.stock.reservedQuantity}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                      p.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {p.status === 'Approved' && <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />}
                      {p.status === 'Rejected' && <ShieldX className="w-3.5 h-3.5 mr-0.5" />}
                      {p.status === 'Pending Approval' && <Clock className="w-3.5 h-3.5 mr-0.5" />}
                      <span>{p.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                    <Link
                      to={`/brand/products/edit/${p._id}`}
                      className="inline-block p-1.5 border border-brand-gray-250 rounded hover:bg-brand-gray-100 text-brand-gray-650 hover:text-brand-gray-900"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 border border-brand-gray-250 rounded hover:bg-red-50 text-brand-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Products;
