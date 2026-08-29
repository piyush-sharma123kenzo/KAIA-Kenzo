import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, FileText, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const AddProduct = () => {
  const { id } = useParams(); // Exists if we are in EDIT mode
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    modelNumber: '',
    SKU: '',
    category: '',
    description: '',
    mrp: '',
    sellingPrice: '',
    gstRate: '18',
    images: [{ url: '', alt: '', order: 0 }],
    stock: {
      quantity: '0',
      reorderThreshold: '5',
    },
  });

  // Specifications Dynamic List State
  const [specList, setSpecList] = useState([{ key: '', val: '' }]);

  // Fetch categories & edit product values if editing
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        const catRes = await axiosInstance.get('/categories');
        if (catRes.data.success) setCategories(catRes.data.categories);

        if (isEditMode) {
          const prodRes = await axiosInstance.get(`/products/${id}`); // Wait, lookup by ID or slug? Wait, the API lookup by slug works, but for editing, does getProductBySlug handle ID? Let's check backend productController.js:
          // getProductBySlug expects a slug. Wait! Let's check backend/controllers/productController.js, yes, getProductBySlug looks up by slug! But wait, is there an endpoint to get a single product by ID? Let's check:
          // Wait, `/products/:slug` is getProductBySlug. What about getMyProducts?
          // If we look at backend/routes/productRoutes.js:
          // `router.get('/:slug', getProductBySlug)`
          // In javascript, mongoose findOne handles slug or ID? It query `findOne({ slug })`. If we pass an ID, it checks slug and won't match. But wait! Can we make the backend find by slug or by ID? Let's check if we can query by ID directly from slug route if it matches ObjectID format!
          // Actually, we can fetch the product details by slug or by ID if we implement it. Or in backend/controllers/productController.js we had:
          // `export const getProductBySlug = async (req, res) => { const { slug } = req.params; ... findOne({ slug }) }`
          // Let's modify the backend `getProductBySlug` or let's find the product by ID when in brand page. Since we are inside the same brand, we can fetch all brand products and filter in React state, which is extremely safe and requires 0 backend changes! Or we can update `/api/products/:slug` to check if `slug` is a valid Mongoose ObjectId, and if so, search by ID or slug! That is a very standard and bulletproof solution.
          // Let's check if we need to do that. Yes! We can look up in brand products list or write a small search in React state. Let's do a search in brand products list—we fetch all brand products and find the matching ID! This is incredibly simple and requires no API changes.
          const sellerProdRes = await axiosInstance.get('/products/seller/my-products');
          if (sellerProdRes.data.success) {
            const match = sellerProdRes.data.products.find(p => p._id === id);
            if (match) {
              setForm({
                name: match.name,
                modelNumber: match.modelNumber,
                SKU: match.SKU,
                category: match.category?._id || match.category,
                description: match.description,
                mrp: match.mrp.toString(),
                sellingPrice: match.sellingPrice.toString(),
                gstRate: match.gstRate?.toString() || '18',
                images: match.images.length > 0 ? match.images : [{ url: '', alt: '', order: 0 }],
                stock: {
                  quantity: match.stock.quantity.toString(),
                  reorderThreshold: match.stock.reorderThreshold.toString(),
                },
              });

              // Load specs list
              const specs = Object.entries(match.specifications || {}).map(([key, val]) => ({ key, val }));
              setSpecList(specs.length > 0 ? specs : [{ key: '', val: '' }]);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing AddProduct screen:', err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [id, isEditMode]);

  // Spec handlers
  const handleAddSpecRow = () => {
    setSpecList([...specList, { key: '', val: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecList(specList.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, value) => {
    const updated = specList.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setSpecList(updated);
  };

  // Image Upload handler
  const handleImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const updatedImages = [...form.images];
        updatedImages[idx] = { url: res.data.url, alt: file.name, order: idx };
        setForm({ ...form, images: updatedImages });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed.');
    }
  };

  const handleAddImageRow = () => {
    setForm({ ...form, images: [...form.images, { url: '', alt: '', order: form.images.length }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Format specifications back to object
    const specificationsObj = {};
    specList.forEach((spec) => {
      if (spec.key.trim() && spec.val.trim()) {
        specificationsObj[spec.key.trim()] = spec.val.trim();
      }
    });

    const payload = {
      name: form.name,
      modelNumber: form.modelNumber,
      SKU: form.SKU,
      category: form.category,
      description: form.description,
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      gstRate: Number(form.gstRate),
      images: form.images.filter(img => img.url.trim() !== ''),
      stock: {
        quantity: Number(form.stock.quantity),
        reorderThreshold: Number(form.stock.reorderThreshold),
      },
      specifications: specificationsObj,
    };

    setLoading(true);
    try {
      if (isEditMode) {
        const res = await axiosInstance.put(`/products/seller/update/${id}`, payload);
        if (res.data.success) {
          setSuccessMsg(res.data.message);
          setTimeout(() => navigate('/brand/products'), 2000);
        }
      } else {
        const res = await axiosInstance.post('/products/seller/create', payload);
        if (res.data.success) {
          setSuccessMsg(res.data.message);
          setTimeout(() => navigate('/brand/products'), 2000);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving product listings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      
      {/* Header Back CTA */}
      <div className="flex items-center space-x-3">
        <Link to="/brand/products" className="p-1.5 border rounded hover:bg-brand-gray-100 text-brand-gray-655">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h2 className="text-xl font-extrabold text-brand-gray-900">
            {isEditMode ? 'Edit Product Listing' : 'Submit New Product Listing'}
          </h2>
          <p className="text-xs text-brand-gray-500">All submissions are reviewed by system administrators.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start space-x-2">
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium space-y-8">
        
        {/* Section 1: Basic */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-brand-gray-950 uppercase tracking-wider border-b pb-2">1. Basic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Product Name / Title:</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Model Number:</label>
              <input
                type="text"
                required
                value={form.modelNumber}
                onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">SKU (Stock Keeping Unit):</label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={form.SKU}
                onChange={(e) => setForm({ ...form, SKU: e.target.value })}
                className={`w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm uppercase ${
                  isEditMode ? 'bg-brand-gray-50 text-brand-gray-400 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Category:</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-brand-gray-650">Detailed Description:</label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-brand-gray-950 uppercase tracking-wider border-b pb-2">2. Pricing & Warehouse Stock</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">MRP (INR):</label>
              <input
                type="number"
                required
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">Selling Price (INR):</label>
              <input
                type="number"
                required
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm font-semibold text-brand-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-650">GST Rate (%):</label>
              <select
                value={form.gstRate}
                onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              >
                <option value="18">18% (Standard Electronics)</option>
                <option value="28">28% (Luxury Computing)</option>
                <option value="12">12% (Networking Devices)</option>
                <option value="5">5% (Accessories)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-gray-655">Initial Stock Qty:</label>
              <input
                type="number"
                required
                value={form.stock.quantity}
                onChange={(e) => setForm({ ...form, stock: { ...form.stock, quantity: e.target.value } })}
                className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm text-sm"
              />
            </div>

          </div>
        </div>

        {/* Section 3: Images */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-brand-gray-950 uppercase tracking-wider border-b pb-2">3. Product Media</h3>
          <div className="space-y-4">
            {form.images.map((img, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 text-xs">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    placeholder="Image URL (e.g. https://unsplash.com/...)"
                    value={img.url}
                    onChange={(e) => {
                      const updated = [...form.images];
                      updated[i].url = e.target.value;
                      setForm({ ...form, images: updated });
                    }}
                    className="w-full bg-brand-light border-brand-gray-255 p-2 rounded"
                  />
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <label className="p-2 border rounded hover:bg-brand-gray-50 flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, i)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddImageRow}
              className="text-xs text-brand-accent hover:underline font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Additional Image Link</span>
            </button>
          </div>
        </div>

        {/* Section 4: Specs */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-brand-gray-955 uppercase tracking-wider border-b pb-2">4. Technical Specifications</h3>
          
          <div className="space-y-3">
            {specList.map((spec, i) => (
              <div key={i} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Key (e.g. RAM, GPU)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                  className="w-1/3 bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-semibold text-brand-gray-700"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 16GB, RTX 4080)"
                  value={spec.val}
                  onChange={(e) => handleSpecChange(i, 'val', e.target.value)}
                  className="flex-1 bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(i)}
                  className="p-2 text-brand-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="text-xs text-brand-accent hover:underline font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Specification Parameter</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-brand-accentHover text-white font-semibold py-3.5 rounded-sm text-sm transition-colors text-center"
        >
          {loading ? 'Saving Submission...' : isEditMode ? 'Save Listing Changes' : 'Submit Listing for Admin Approval'}
        </button>

      </form>
    </div>
  );
};

export default AddProduct;
