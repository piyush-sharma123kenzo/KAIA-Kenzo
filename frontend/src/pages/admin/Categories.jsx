import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Edit, Search, CheckCircle, 
  XCircle, AlertCircle, X, ChevronRight, Image 
} from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseCommission: 5.0,
    parentCategory: '',
    image: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getCategories();
      if (res.success || Array.isArray(res)) {
        setCategories(res.categories || res || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditCategory(null);
    setFormData({ name: '', description: '', baseCommission: 5.0, parentCategory: '', image: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      baseCommission: cat.baseCommission || 5.0,
      parentCategory: cat.parentCategory?._id || cat.parentCategory || '',
      image: cat.image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editCategory) {
        await axiosInstance.patch(`/admin/categories/${editCategory._id}`, formData);
      } else {
        await axiosInstance.post('/admin/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Marketplace Category Hierarchy & Commission Rates
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Configure parent/child category taxonomies, default platform commission rates, and catalog icons.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="text-xs uppercase font-bold flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </Button>
      </div>

      {/* 2. Categories Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-brand-gray-200 p-16 rounded-sm text-center shadow-premium space-y-3">
          <Layers className="w-12 h-12 text-brand-gray-300 mx-auto" />
          <h3 className="text-base font-black text-brand-gray-900 uppercase">No categories found</h3>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-gray-200 text-left text-xs">
              <thead className="bg-brand-gray-50 uppercase tracking-wider font-bold text-[10px] text-brand-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5">Parent Category</th>
                  <th className="px-4 py-3.5">Default Commission</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-brand-gray-200 text-brand-gray-800">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-brand-gray-50/70 font-medium">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded border bg-brand-light flex items-center justify-center font-bold text-brand-accent shrink-0">
                          {c.image ? <img src={c.image} alt="" className="object-contain w-full h-full p-1" /> : c.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-brand-gray-900">{c.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-brand-gray-500">
                      {c.slug}
                    </td>

                    <td className="px-4 py-3.5 text-brand-gray-600">
                      {c.parentCategory?.name || c.parentCategory || 'Root Level'}
                    </td>

                    <td className="px-4 py-3.5 font-black text-indigo-700 font-mono">
                      {c.baseCommission || 5.0}%
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                        Active
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(c)}
                        className="text-[10px] uppercase font-bold py-1 px-2.5"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-premium max-w-md w-full p-6 space-y-4 border border-brand-gray-200">
            <div className="flex justify-between items-center border-b border-brand-gray-200 pb-3">
              <h3 className="font-black text-sm text-brand-gray-900 uppercase">
                {editCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-brand-gray-400 hover:text-brand-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gaming Laptops"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Parent Category (Optional)</label>
                <select
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-bold"
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {categories
                    .filter((cat) => !editCategory || cat._id !== editCategory._id)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Base Platform Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.baseCommission}
                  onChange={(e) => setFormData({ ...formData, baseCommission: Number(e.target.value) })}
                  className="w-full p-2 border border-brand-gray-200 rounded font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-brand-gray-700 uppercase text-[10px] block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-2 border border-brand-gray-200 rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-brand-gray-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;
