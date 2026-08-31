import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, FileText, CheckCircle, Info, Sparkles, AlertCircle } from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import categoryService from '../../services/categoryService';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';

// Preset category specifications templates
const CATEGORY_SPEC_PRESETS = {
  laptops: [
    { key: 'Processor', placeholder: 'e.g. Intel Core Ultra 9 / AMD Ryzen 9 8945HS' },
    { key: 'RAM', placeholder: 'e.g. 32GB LPDDR5X 7467MHz' },
    { key: 'Storage', placeholder: 'e.g. 1TB PCIe 4.0 NVMe SSD' },
    { key: 'GPU', placeholder: 'e.g. NVIDIA GeForce RTX 4080 (12GB)' },
    { key: 'Display', placeholder: 'e.g. 16.0" 2.5K OLED 240Hz 0.2ms' },
    { key: 'Operating System', placeholder: 'e.g. Windows 11 Home / Linux' },
    { key: 'Weight', placeholder: 'e.g. 1.85 kg' },
  ],
  smartphones: [
    { key: 'Display', placeholder: 'e.g. 6.8" Dynamic AMOLED 2X 120Hz' },
    { key: 'Processor', placeholder: 'e.g. Snapdragon 8 Gen 3 / MediaTek Dimensity 9300' },
    { key: 'RAM', placeholder: 'e.g. 12GB LPDDR5X' },
    { key: 'Storage', placeholder: 'e.g. 256GB UFS 4.0' },
    { key: 'Battery', placeholder: 'e.g. 5000 mAh with 45W Fast Charging' },
    { key: 'Camera', placeholder: 'e.g. 200MP Main + 50MP Periscope + 12MP Ultra Wide' },
    { key: 'Connectivity', placeholder: 'e.g. 5G Dual SIM, Wi-Fi 7, Bluetooth 5.3' },
  ],
  headphones: [
    { key: 'Battery Life', placeholder: 'e.g. Up to 30 hours with ANC ON' },
    { key: 'Drivers', placeholder: 'e.g. 40mm Carbon Fiber Composite' },
    { key: 'Noise Cancellation', placeholder: 'e.g. Adaptive Active Noise Cancelling (8 Mics)' },
    { key: 'Connectivity', placeholder: 'e.g. Bluetooth 5.3, LDAC, Multi-point' },
    { key: 'Weight', placeholder: 'e.g. 250 grams' },
  ],
  earbuds: [
    { key: 'Battery Life', placeholder: 'e.g. 8h earbuds + 24h charging case' },
    { key: 'Noise Cancellation', placeholder: 'e.g. Hybrid ANC with transparency mode' },
    { key: 'Water Resistance', placeholder: 'e.g. IPX4 Sweat & Splash Proof' },
    { key: 'Connectivity', placeholder: 'e.g. Bluetooth 5.3 with AAC/LDAC' },
  ],
  'pc-components': [
    { key: 'Socket / Interface', placeholder: 'e.g. LGA 1700 / PCIe Gen 5.0' },
    { key: 'Cores / Threads', placeholder: 'e.g. 24 Cores (8P + 16E), 32 Threads' },
    { key: 'Clock Speed', placeholder: 'e.g. 3.4 GHz Base / 6.0 GHz Boost' },
    { key: 'TDP / Power', placeholder: 'e.g. 125W Base, 253W Max Turbo' },
    { key: 'Memory Support', placeholder: 'e.g. DDR5 up to 6400 MT/s' },
  ],
  'monitors-and-displays': [
    { key: 'Screen Size', placeholder: 'e.g. 27-inch Curved (1800R)' },
    { key: 'Panel Type', placeholder: 'e.g. QD-OLED / Fast IPS' },
    { key: 'Resolution', placeholder: 'e.g. 4K UHD (3840 x 2160)' },
    { key: 'Refresh Rate', placeholder: 'e.g. 240Hz' },
    { key: 'Response Time', placeholder: 'e.g. 0.03ms (GtG)' },
    { key: 'Ports', placeholder: 'e.g. 2x HDMI 2.1, 1x DP 1.4, 90W USB-C' },
  ],
  'cameras-and-imaging': [
    { key: 'Sensor', placeholder: 'e.g. 45MP Full-Frame Stacked CMOS' },
    { key: 'Video Resolution', placeholder: 'e.g. 8K 60p RAW, 4K 120p 10-bit' },
    { key: 'Lens Mount', placeholder: 'e.g. Canon RF / Sony E-Mount' },
    { key: 'Image Stabilization', placeholder: 'e.g. 5-Axis In-Body IS (8.5 Stops)' },
  ],
};

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEditMode);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    modelNumber: '',
    SKU: '',
    category: '',
    description: '',
    shortDescription: '',
    mrp: '',
    sellingPrice: '',
    warranty: '1 Year Brand Manufacturer Warranty',
    status: 'Draft',
    stock: {
      quantity: '10',
      reorderThreshold: '4',
    },
    images: [{ url: '', alt: '', order: 0 }],
  });

  // Dynamic Specs & Highlights List
  const [specList, setSpecList] = useState([{ key: '', val: '' }]);
  const [highlights, setHighlights] = useState(['']);

  // Fetch categories & existing product details if edit mode
  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await categoryService.getCategories();
        if (catRes.success) {
          setCategories(catRes.categories || catRes.data || []);
        }

        if (isEditMode) {
          const prodRes = await brandSellerService.getProductById(id);
          if (prodRes.success && prodRes.product) {
            const p = prodRes.product;
            setForm({
              name: p.name || '',
              modelNumber: p.modelNumber || '',
              SKU: p.SKU || '',
              category: p.category?._id || p.category || '',
              description: p.description || '',
              shortDescription: p.shortDescription || '',
              mrp: p.mrp ? p.mrp.toString() : '',
              sellingPrice: p.sellingPrice ? p.sellingPrice.toString() : '',
              warranty: p.warranty || '1 Year Brand Manufacturer Warranty',
              status: p.status || 'Draft',
              stock: {
                quantity: p.stock?.quantity ? p.stock.quantity.toString() : '0',
                reorderThreshold: p.stock?.reorderThreshold ? p.stock.reorderThreshold.toString() : '4',
              },
              images: p.images && p.images.length > 0 ? p.images : [{ url: '', alt: '', order: 0 }],
            });

            // Specs
            const specs = Object.entries(p.specifications || {}).map(([key, val]) => ({ key, val: String(val) }));
            setSpecList(specs.length > 0 ? specs : [{ key: '', val: '' }]);

            // Highlights
            setHighlights(p.highlights && p.highlights.length > 0 ? p.highlights : ['']);
          }
        }
      } catch (err) {
        console.error('Error initializing product editor:', err);
        setErrorMsg('Error loading product details.');
      } finally {
        setInitLoading(false);
      }
    };
    initData();
  }, [id, isEditMode]);

  // Apply preset specs based on selected category slug
  const handleCategoryChange = (catId) => {
    setForm({ ...form, category: catId });
    const selected = categories.find((c) => c._id === catId);
    if (!selected) return;

    const slug = selected.slug;
    let presetKey = Object.keys(CATEGORY_SPEC_PRESETS).find((k) => slug.includes(k));
    if (presetKey && CATEGORY_SPEC_PRESETS[presetKey] && (!specList[0]?.key || specList.length <= 1)) {
      setSpecList(
        CATEGORY_SPEC_PRESETS[presetKey].map((p) => ({
          key: p.key,
          val: '',
        }))
      );
    }
  };

  // Specs Handlers
  const handleAddSpecRow = () => setSpecList([...specList, { key: '', val: '' }]);
  const handleRemoveSpecRow = (idx) => setSpecList(specList.filter((_, i) => i !== idx));
  const handleSpecChange = (idx, field, value) => {
    const updated = [...specList];
    updated[idx][field] = value;
    setSpecList(updated);
  };

  // Highlights Handlers
  const handleAddHighlight = () => setHighlights([...highlights, '']);
  const handleRemoveHighlight = (idx) => setHighlights(highlights.filter((_, i) => i !== idx));
  const handleHighlightChange = (idx, value) => {
    const updated = [...highlights];
    updated[idx] = value;
    setHighlights(updated);
  };

  // Image Handlers
  const handleAddImageRow = () => {
    setForm({
      ...form,
      images: [...form.images, { url: '', alt: '', order: form.images.length }],
    });
  };
  const handleRemoveImageRow = (idx) => {
    if (form.images.length === 1) return;
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== idx),
    });
  };
  const handleImageChange = (idx, value) => {
    const updated = [...form.images];
    updated[idx].url = value;
    setForm({ ...form, images: updated });
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (Number(form.sellingPrice) <= 0) {
      setErrorMsg('Selling Price must be greater than zero.');
      return;
    }
    if (Number(form.mrp) < Number(form.sellingPrice)) {
      setErrorMsg('MRP cannot be lower than Selling Price.');
      return;
    }

    // Convert specs array back to object
    const specificationsObj = {};
    specList.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specificationsObj[s.key.trim()] = s.val.trim();
      }
    });

    // Filter highlights
    const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

    // Filter images
    const cleanImages = form.images.filter((img) => img.url.trim() !== '');

    const payload = {
      name: form.name.trim(),
      modelNumber: form.modelNumber.trim(),
      SKU: form.SKU.trim(),
      category: form.category,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || form.description.trim().substring(0, 120),
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      warranty: form.warranty.trim(),
      status: form.status,
      stock: {
        quantity: parseInt(form.stock.quantity, 10) || 0,
        reorderThreshold: parseInt(form.stock.reorderThreshold, 10) || 4,
      },
      specifications: specificationsObj,
      highlights: cleanHighlights,
      images: cleanImages,
    };

    setLoading(true);
    try {
      if (isEditMode) {
        const res = await brandSellerService.updateProduct(id, payload);
        if (res.success) {
          setSuccessMsg('Product listing updated successfully.');
          setTimeout(() => navigate('/brand/products'), 1500);
        }
      } else {
        const res = await brandSellerService.createProduct(payload);
        if (res.success) {
          setSuccessMsg('Product listing published/submitted successfully.');
          setTimeout(() => navigate('/brand/products'), 1500);
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setErrorMsg(err.response?.data?.message || 'Error saving product. Please check your fields.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse text-left">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-brand-gray-200 pb-4">
        <Link to="/brand/products" className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            {isEditMode ? 'Edit Technology Product' : 'Create New Hardware Listing'}
          </h2>
          <p className="text-xs text-brand-gray-500">
            Publish verified items directly to the KAIA multi-brand electronics catalog.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-brand-gray-200 p-6 md:p-8 rounded-sm shadow-premium space-y-8">
        
        {/* Section 1: Basic Identifiers */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5 flex items-center space-x-2">
            <span>1. Core Identification & Category</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Product Name / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. ASUS ROG Zephyrus G16 (2024) OLED Gaming Laptop"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-semibold focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold text-brand-gray-800 focus:border-brand-accent focus:ring-0"
              >
                <option value="">Select Platform Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Model Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. GU605MZ-WS96"
                value={form.modelNumber}
                onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-semibold uppercase focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">SKU (Unique Code) *</label>
              <input
                type="text"
                required
                disabled={isEditMode}
                placeholder="e.g. ASU-ZEPH-G16-001"
                value={form.SKU}
                onChange={(e) => setForm({ ...form, SKU: e.target.value })}
                className={`w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono font-bold uppercase focus:border-brand-accent focus:ring-0 ${
                  isEditMode ? 'bg-brand-gray-100 text-brand-gray-400 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Catalog Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold uppercase focus:border-brand-accent focus:ring-0"
              >
                <option value="Draft">Draft (Save Privately)</option>
                <option value="Pending Approval">Submit for Platform Review</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Short Summary</label>
              <input
                type="text"
                placeholder="One-line summary for product cards and search results..."
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Full Technical Description *</label>
              <textarea
                rows={4}
                required
                placeholder="Complete product overview, materials, warranty disclosures, and packaging contents..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing, Stock & Warranty */}
        <div className="space-y-4">
          <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider border-b border-brand-gray-200 pb-2.5">
            2. Commercial Pricing & Inventory Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 149900"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-black text-brand-accent focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">MRP / Compare (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 169900"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold text-brand-gray-700 focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Warehouse Stock *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 25"
                value={form.stock.quantity}
                onChange={(e) => setForm({ ...form, stock: { ...form.stock, quantity: e.target.value } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={form.stock.reorderThreshold}
                onChange={(e) => setForm({ ...form, stock: { ...form.stock, reorderThreshold: e.target.value } })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold focus:border-brand-accent focus:ring-0"
              />
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-4">
              <label className="text-xs font-bold text-brand-gray-700 uppercase tracking-wider">Warranty & Support Guarantee</label>
              <input
                type="text"
                placeholder="e.g. 1 Year Official Brand Warranty with GST Invoicing & On-Site Replacement"
                value={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Section 3: High-Res Image URLs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
            <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
              3. Product Imagery (Direct URLs)
            </h3>
            <button
              type="button"
              onClick={handleAddImageRow}
              className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Image URL</span>
            </button>
          </div>

          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className="text-[10px] font-bold text-brand-gray-400 w-6 shrink-0">#{i + 1}</span>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={img.url}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  className="flex-1 bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-mono focus:border-brand-accent focus:ring-0"
                />
                {img.url && (
                  <div className="w-8 h-8 rounded border overflow-hidden shrink-0 bg-brand-gray-100">
                    <img src={img.url} alt="" className="object-cover h-full w-full" />
                  </div>
                )}
                <button
                  type="button"
                  disabled={form.images.length === 1}
                  onClick={() => handleRemoveImageRow(i)}
                  className="p-2 text-brand-gray-400 hover:text-red-500 rounded disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Dynamic Category Specifications */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
            <div>
              <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
                4. Technical Specifications
              </h3>
              <p className="text-[10px] text-brand-gray-400">Dynamic category parameters displayed on public customer specs sheets.</p>
            </div>
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spec Row</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {specList.map((spec, i) => (
              <div key={i} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Parameter (e.g. Processor, RAM)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                  className="w-1/3 bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-bold text-brand-gray-800 focus:border-brand-accent focus:ring-0"
                />
                <input
                  type="text"
                  placeholder="Specification details (e.g. 32GB LPDDR5X)"
                  value={spec.val}
                  onChange={(e) => handleSpecChange(i, 'val', e.target.value)}
                  className="flex-1 bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs focus:border-brand-accent focus:ring-0 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(i)}
                  className="p-2 text-brand-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Highlights Bullet Points */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
            <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
              5. Product Highlights (Bullet Points)
            </h3>
            <button
              type="button"
              onClick={handleAddHighlight}
              className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Highlight</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {highlights.map((hl, i) => (
              <div key={i} className="flex items-center space-x-3">
                <span className="text-[10px] font-bold text-brand-gray-400 w-4">#{i + 1}</span>
                <input
                  type="text"
                  placeholder="e.g. Revolutionary Tandem OLED Ultra Retina XDR Display with ProMotion"
                  value={hl}
                  onChange={(e) => handleHighlightChange(i, e.target.value)}
                  className="flex-1 bg-brand-light border border-brand-gray-250 p-2 rounded-sm text-xs font-medium focus:border-brand-accent focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(i)}
                  className="p-2 text-brand-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-brand-gray-200 flex flex-col sm:flex-row justify-end items-center gap-3">
          <Link to="/brand/products" className="w-full sm:w-auto text-center">
            <Button variant="outline" size="md" className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider"
          >
            {loading ? 'Saving Listing...' : isEditMode ? 'Save Listing Changes' : 'Publish Product to Catalog'}
          </Button>
        </div>

      </form>

    </div>
  );
};

export default AddProduct;
