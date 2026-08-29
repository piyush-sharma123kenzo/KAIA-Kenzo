import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, Clock, Check, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/products/pending');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching pending products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleVerify = async (id, status) => {
    if (!window.confirm(`Are you sure you want to set product status to ${status}?`)) return;
    try {
      const res = await axiosInstance.put(`/admin/products/${id}/verify`, { status });
      if (res.data.success) {
        alert(res.data.message);
        fetchPendingProducts();
      }
    } catch (err) {
      alert('Verification action failed.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-brand-gray-500">Loading pending catalog items...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-extrabold text-brand-gray-900">Product listings Desk</h2>
        <p className="text-xs text-brand-gray-500">Approve or reject submitted product details, pricing MRPs, and category mappings.</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border p-12 text-center text-brand-gray-500">No product listings awaiting approval.</div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
            <thead className="bg-brand-gray-50 text-brand-gray-500 font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">SKU / Model</th>
                <th className="px-6 py-4">MRP / Selling Price</th>
                <th className="px-6 py-4">Initial Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Fulfillment Verification</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y text-brand-gray-700">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-brand-gray-50/50">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded border bg-brand-gray-50 p-1 flex items-center justify-center shrink-0">
                      <img src={p.images[0]?.url} alt="" className="object-contain max-h-full max-w-full" />
                    </div>
                    <div>
                      <span className="font-bold text-brand-gray-900 truncate max-w-[200px] block">{p.name}</span>
                      <span className="text-[10px] text-brand-gray-400 capitalize block mt-0.5">{p.category?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">{p.brand?.name}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{p.SKU}</p>
                    <p className="text-[10px] text-brand-gray-400 mt-0.5">{p.modelNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-brand-gray-900">₹{p.sellingPrice.toLocaleString()}</p>
                    <p className="text-[10px] text-brand-gray-400 line-through">₹{p.mrp.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold">{p.stock.quantity} Units</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
                      <Clock className="w-3.5 h-3.5 mr-0.5" />
                      <span>{p.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleVerify(p._id, 'Approved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(p._id, 'Rejected')}
                      className="bg-red-650 hover:bg-red-700 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase"
                    >
                      Reject
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
