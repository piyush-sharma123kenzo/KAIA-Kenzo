import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Upload, FileText, CheckCircle, Info, Sparkles, 
  AlertCircle, Image as ImageIcon, Video as VideoIcon, Star, Loader2, X
} from 'lucide-react';
import brandSellerService from '../../services/brandSellerService';
import categoryService from '../../services/categoryService';
import axiosInstance from '../../api/axiosInstance';
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
  const location = useLocation();
  const basePath = location.pathname.startsWith('/vendor') ? '/vendor' : '/brand';
  const isEditMode = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(isEditMode);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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
    warranty: '1 Year Official Brand Warranty with GST Invoicing',
    status: 'Pending Approval',
    stock: {
      quantity: '10',
      reorderThreshold: '4',
    },
    images: [{ url: '', alt: '', isPrimary: true, order: 0 }],
    video: { url: '', publicId: '' },
  });

  // Dynamic Specs & Highlights List
  const [specList, setSpecList] = useState([{ key: '', val: '' }]);
  const [highlights, setHighlights] = useState(['']);

  // Fetch categories & existing product details if edit mode
  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await categoryService.getCategories();
        let catList = [];
        if (Array.isArray(catRes)) {
          catList = catRes;
        } else if (catRes?.categories && Array.isArray(catRes.categories)) {
          catList = catRes.categories;
        } else if (catRes?.data && Array.isArray(catRes.data)) {
          catList = catRes.data;
        } else if (catRes?.data?.categories && Array.isArray(catRes.data.categories)) {
          catList = catRes.data.categories;
        }
        setCategories(catList);

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
              warranty: p.warranty || '1 Year Official Brand Warranty with GST Invoicing',
              status: p.status || 'Draft',
              stock: {
                quantity: p.stock?.quantity ? p.stock.quantity.toString() : '0',
                reorderThreshold: p.stock?.reorderThreshold ? p.stock.reorderThreshold.toString() : '4',
              },
              images: p.images && p.images.length > 0 
                ? p.images.map((img, idx) => ({
                    url: typeof img === 'string' ? img : img.url,
                    alt: img.alt || '',
                    isPrimary: img.isPrimary || idx === 0,
                    publicId: img.publicId || '',
                    order: idx,
                  }))
                : [{ url: '', alt: '', isPrimary: true, order: 0 }],
              video: p.video || { url: '', publicId: '' },
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

    const slug = selected.slug || '';
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
      images: [...form.images, { url: '', alt: '', isPrimary: form.images.length === 0, order: form.images.length }],
    });
  };

  const handleRemoveImageRow = (idx) => {
    if (form.images.length === 1) {
      setForm({ ...form, images: [{ url: '', alt: '', isPrimary: true, order: 0 }] });
      return;
    }
    const filtered = form.images.filter((_, i) => i !== idx);
    // Ensure one image is marked primary
    if (!filtered.some((img) => img.isPrimary) && filtered.length > 0) {
      filtered[0].isPrimary = true;
    }
    setForm({ ...form, images: filtered });
  };

  const handleSetPrimaryImage = (idx) => {
    const updated = form.images.map((img, i) => ({
      ...img,
      isPrimary: i === idx,
    }));
    setForm({ ...form, images: updated });
  };

  const handleImageChange = (idx, value) => {
    const updated = [...form.images];
    updated[idx].url = value;
    setForm({ ...form, images: updated });
  };

  // Cloudinary Direct Media Upload Handlers
  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    setErrorMsg('');
    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('image', files[0]);
        formData.append('folder', 'kaia/products');

        const res = await axiosInstance.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data.url) {
          const currentValid = form.images.filter((img) => img.url.trim() !== '');
          setForm({
            ...form,
            images: [
              ...currentValid,
              {
                url: res.data.url,
                publicId: res.data.publicId,
                alt: form.name || 'Product Image',
                isPrimary: currentValid.length === 0,
                order: currentValid.length,
              },
            ],
          });
        }
      } else {
        const formData = new FormData();
        files.slice(0, 8).forEach((f) => formData.append('images', f));
        formData.append('folder', 'kaia/products');

        const res = await axiosInstance.post('/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && Array.isArray(res.data.urls)) {
          const currentValid = form.images.filter((img) => img.url.trim() !== '');
          const newItems = res.data.urls.map((url, idx) => ({
            url,
            publicId: res.data.assets?.[idx]?.publicId || '',
            alt: form.name || `Product image ${currentValid.length + idx + 1}`,
            isPrimary: currentValid.length === 0 && idx === 0,
            order: currentValid.length + idx,
          }));

          setForm({
            ...form,
            images: [...currentValid, ...newItems],
          });
        }
      }
    } catch (err) {
      console.error('Cloudinary Image Upload Error:', err);
      setErrorMsg(err.response?.data?.message || 'Error uploading image to Cloudinary. You may also enter direct URLs.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('folder', 'kaia/videos');

      const res = await axiosInstance.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.url) {
        setForm({
          ...form,
          video: {
            url: res.data.url,
            publicId: res.data.publicId,
          },
        });
      }
    } catch (err) {
      console.error('Cloudinary Video Upload Error:', err);
      setErrorMsg(err.response?.data?.message || 'Error uploading video to Cloudinary.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  // Build Payload
  const buildPayload = (targetStatus) => {
    const specificationsObj = {};
    specList.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specificationsObj[s.key.trim()] = s.val.trim();
      }
    });

    const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);
    const cleanImages = form.images.filter((img) => img.url && img.url.trim() !== '');

    return {
      name: form.name.trim(),
      modelNumber: form.modelNumber.trim(),
      SKU: form.SKU.trim(),
      category: form.category,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || form.description.trim().substring(0, 120),
      mrp: Number(form.mrp) || Number(form.sellingPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      warranty: form.warranty.trim(),
      status: targetStatus,
      stock: {
        quantity: parseInt(form.stock.quantity, 10) || 0,
        reorderThreshold: parseInt(form.stock.reorderThreshold, 10) || 4,
      },
      specifications: specificationsObj,
      highlights: cleanHighlights,
      images: cleanImages.length > 0 ? cleanImages : [{ url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800', alt: form.name, isPrimary: true, order: 0 }],
      video: form.video?.url ? form.video : undefined,
    };
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Product name is required even when saving a draft.');
      return;
    }

    setDraftLoading(true);
    try {
      const payload = buildPayload('Draft');
      if (isEditMode) {
        const res = await brandSellerService.updateProduct(id, payload);
        if (res.success) {
          setSuccessMsg('Product draft saved successfully.');
          setTimeout(() => navigate(`${basePath}/products`), 1200);
        }
      } else {
        const res = await brandSellerService.createProduct(payload);
        if (res.success) {
          setSuccessMsg('Product draft created successfully.');
          setTimeout(() => navigate(`${basePath}/products`), 1200);
        }
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setErrorMsg(err.response?.data?.message || 'Error saving draft. Please check SKU uniqueness.');
    } finally {
      setDraftLoading(false);
    }
  };

  // Full Submission for Catalog Review / Publish
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Product Name / Title is required.');
      return;
    }
    if (!form.category) {
      setErrorMsg('Category selection is mandatory.');
      return;
    }
    if (!form.modelNumber.trim()) {
      setErrorMsg('Model Number is required.');
      return;
    }
    if (!form.SKU.trim()) {
      setErrorMsg('SKU is required.');
      return;
    }
    if (Number(form.sellingPrice) <= 0) {
      setErrorMsg('Selling Price must be greater than zero ₹.');
      return;
    }
    if (Number(form.mrp) < Number(form.sellingPrice)) {
      setErrorMsg('MRP cannot be lower than Selling Price.');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg('Technical Description is required.');
      return;
    }

    const targetStatus = form.status === 'Draft' ? 'Draft' : 'Pending Approval';
    const payload = buildPayload(targetStatus);

    setLoading(true);
    try {
      if (isEditMode) {
        const res = await brandSellerService.updateProduct(id, payload);
        if (res.success) {
          setSuccessMsg('Product listing updated and submitted successfully.');
          setTimeout(() => navigate(`${basePath}/products`), 1200);
        }
      } else {
        const res = await brandSellerService.createProduct(payload);
        if (res.success) {
          setSuccessMsg('Product listing published/submitted for review successfully.');
          setTimeout(() => navigate(`${basePath}/products`), 1200);
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setErrorMsg(err.response?.data?.message || 'Error submitting product. Please verify SKU and required fields.');
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
        <Link to={`${basePath}/products`} className="p-2 border border-brand-gray-200 rounded hover:bg-brand-gray-100 text-brand-gray-600 transition-colors">
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
                  <option key={c._id || c.id || c.slug} value={c._id || c.id || c.slug}>
                    {c.name}
                  </option>
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

        {/* Section 3: High-Res Image Uploads & URLs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-brand-gray-200 pb-2.5">
            <div>
              <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
                3. Product Imagery (Cloudinary & Direct URLs)
              </h3>
              <p className="text-[10px] text-brand-gray-400">Upload high-resolution media directly to Cloudinary or specify image URLs.</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* File Upload Trigger */}
              <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-brand-dark hover:bg-brand-gray-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 text-brand-accent" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Files'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={uploadingImage}
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleAddImageRow}
                className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL Slot</span>
              </button>
            </div>
          </div>

          {uploadingImage && (
            <div className="p-3 bg-brand-light border border-brand-accent/30 rounded flex items-center space-x-2 text-xs font-bold text-brand-accent animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Uploading media to Cloudinary CDN storage...</span>
            </div>
          )}

          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-brand-gray-50/50 border border-brand-gray-200 rounded-sm">
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-bold text-brand-gray-400 w-6">#{i + 1}</span>
                  {img.url ? (
                    <div className="relative w-12 h-12 rounded border overflow-hidden shrink-0 bg-brand-gray-100 group">
                      <img src={img.url} alt="" className="object-cover h-full w-full" />
                      {img.isPrimary && (
                        <span className="absolute bottom-0 inset-x-0 bg-brand-dark/90 text-amber-400 font-bold text-[8px] text-center uppercase leading-tight py-0.5">
                          Primary
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded border border-dashed border-brand-gray-300 flex items-center justify-center bg-white text-brand-gray-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/... or image URL"
                    value={img.url}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    className="w-full bg-white border border-brand-gray-250 p-2 rounded-sm text-xs font-mono focus:border-brand-accent focus:ring-0"
                  />
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(i)}
                    className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded flex items-center space-x-1 border transition-colors ${
                      img.isPrimary
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-white text-brand-gray-600 border-brand-gray-300 hover:border-brand-accent'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    <span>{img.isPrimary ? 'Primary' : 'Set Primary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveImageRow(i)}
                    className="p-1.5 text-brand-gray-400 hover:text-red-500 rounded border border-transparent hover:border-red-200 transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Product Video */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-brand-gray-200 pb-2.5">
            <div>
              <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
                4. Product Video (Optional)
              </h3>
              <p className="text-[10px] text-brand-gray-400">Upload MP4/WebM video showcase or enter video stream URL.</p>
            </div>

            <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-brand-dark hover:bg-brand-gray-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
              <VideoIcon className="w-3.5 h-3.5 text-brand-accent" />
              <span>{uploadingVideo ? 'Uploading Video...' : 'Upload Video'}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={uploadingVideo}
                onChange={handleVideoFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2">
            <input
              type="url"
              placeholder="e.g. https://res.cloudinary.com/.../video.mp4"
              value={form.video?.url || ''}
              onChange={(e) => setForm({ ...form, video: { ...form.video, url: e.target.value } })}
              className="w-full bg-brand-light border border-brand-gray-250 p-2.5 rounded-sm text-xs font-mono focus:border-brand-accent focus:ring-0"
            />
            {form.video?.url && (
              <div className="p-3 bg-brand-gray-50 border border-brand-gray-200 rounded flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-brand-gray-700">
                  <VideoIcon className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono truncate max-w-md">{form.video.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, video: { url: '', publicId: '' } })}
                  className="text-brand-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Dynamic Category Specifications */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
            <div>
              <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
                5. Technical Specifications
              </h3>
              <p className="text-[10px] text-brand-gray-400">Dynamic category parameters displayed on customer specs sheets.</p>
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

        {/* Section 6: Highlights Bullet Points */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-brand-gray-200 pb-2.5">
            <h3 className="font-black text-xs text-brand-gray-900 uppercase tracking-wider">
              6. Product Highlights (Bullet Points)
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
          <Link to={`${basePath}/products`} className="w-full sm:w-auto text-center">
            <Button variant="outline" size="md" className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider">
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={loading || draftLoading}
            onClick={handleSaveDraft}
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider border-brand-gray-400 text-brand-gray-800 hover:bg-brand-gray-100"
          >
            {draftLoading ? 'Saving Draft...' : 'Save as Draft'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || draftLoading}
            className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider"
          >
            {loading ? 'Submitting...' : isEditMode ? 'Save Listing Changes' : 'Publish Product to Catalog'}
          </Button>
        </div>

      </form>

    </div>
  );
};

export default AddProduct;
