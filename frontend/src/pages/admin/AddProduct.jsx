import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Plus, Trash2, X, Sparkles, 
  Check, Layers, Tag, DollarSign, Package, Shield, 
  HelpCircle, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { brandService } from '../../services/brandService';
import { categoryService } from '../../services/categoryService';
import Button from '../../components/ui/Button';

const AddProduct = () => {
  const navigate = useNavigate();

  // Core product form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    mrp: '',
    sellingPrice: '',
    stockQuantity: '10',
    SKU: '',
    modelNumber: '',
    gstRate: '18',
    warrantySummary: '1 Year Brand Manufacturer Warranty',
    status: 'Approved',
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
  });

  // Images state (array of URL strings or image objects)
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Dynamic Specifications key-value pairs
  const [specs, setSpecs] = useState([
    { key: 'Processor', value: '' },
    { key: 'RAM', value: '' },
    { key: 'Storage', value: '' },
    { key: 'Display', value: '' },
  ]);

  // Brand and Category list + Inline Creation
  const [brandsList, setBrandsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          brandService.getBrands().catch(() => ({ success: false })),
          categoryService.getCategories().catch(() => ({ success: false })),
        ]);
        if (bRes.success) setBrandsList(bRes.brands || bRes.data || []);
        if (cRes.success) setCategoriesList(cRes.categories || cRes.data || []);
      } catch (err) {
        console.error('Error loading dropdown metadata:', err);
      }
    };
    loadDropdownData();
  }, []);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle Image Uploads (supports multiple files from computer)
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setErrorMsg('');

    try {
      const res = await adminService.uploadMultipleImages(files);
      if (res.success && res.urls) {
        setImages((prev) => [...prev, ...res.urls]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload images. Please check file type & size.');
    } finally {
      setUploadingImages(false);
    }
  };

  // Add direct image URL
  const handleAddImageUrl = (url) => {
    if (!url || !url.trim()) return;
    setImages((prev) => [...prev, url.trim()]);
  };

  // Remove image
  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Move image to primary (index 0)
  const handleMakePrimary = (indexToPromote) => {
    setImages((prev) => {
      const target = prev[indexToPromote];
      const filtered = prev.filter((_, idx) => idx !== indexToPromote);
      return [target, ...filtered];
    });
  };

  // Specifications management
  const handleSpecChange = (index, field, val) => {
    setSpecs((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleAddSpecRow = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index) => {
    setSpecs((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate discount percentage helper
  const calculateDiscount = () => {
    const mrp = Number(formData.mrp);
    const price = Number(formData.sellingPrice);
    if (mrp && price && mrp > price) {
      return Math.round(((mrp - price) / mrp) * 100);
    }
    return 0;
  };

  // Submit and Publish Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      setErrorMsg('Please specify a valid selling price.');
      return;
    }

    if (images.length === 0) {
      setErrorMsg('Please upload at least one product image.');
      return;
    }

    // Build specifications dictionary
    const specsMap = {};
    specs.forEach((s) => {
      if (s.key && s.key.trim() && s.value && s.value.trim()) {
        specsMap[s.key.trim()] = s.value.trim();
      }
    });

    // Resolve Brand
    const finalBrand = isCreatingBrand ? newBrandName.trim() : formData.brand;
    // Resolve Category
    const finalCategory = isCreatingCategory ? newCategoryName.trim() : formData.category;

    const payload = {
      ...formData,
      brand: finalBrand,
      category: finalCategory,
      mrp: Number(formData.mrp || formData.sellingPrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: Number(formData.stockQuantity || 10),
      images: images.map((url, idx) => ({
        url,
        altText: `${formData.name} - View ${idx + 1}`,
        isPrimary: idx === 0,
      })),
      specifications: specsMap,
      status: formData.isActive ? 'Approved' : 'Inactive',
    };

    setSaving(true);
    try {
      const res = await adminService.createProduct(payload);
      if (res.success) {
        setSuccessMsg('Product published live to the storefront successfully!');
        setTimeout(() => {
          navigate('/admin/products');
        }, 800);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left font-sans pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/products"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Add New Product
            </h1>
            <p className="text-xs text-slate-500">
              Upload real product photos and configure catalog metadata for instant publication.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Real Product Image Upload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                1. Product Photography & Images
              </h2>
              <p className="text-xs text-slate-500">
                Upload real product images from your computer. First image will be used as the primary card image.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {images.length} Image{images.length !== 1 ? 's' : ''} Selected
            </span>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-8 text-center bg-[#F8FAFC] transition-colors relative cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImages}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {uploadingImages ? 'Uploading images...' : 'Click to select or drag & drop product photos'}
              </p>
              <p className="text-xs text-slate-400">
                Supports PNG, JPG, WEBP, SVG up to 10MB each (Main, Front, Back, Side views)
              </p>
            </div>
          </div>

          {/* Image Previews Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-2">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`relative group rounded-xl border p-2 bg-white flex flex-col justify-between overflow-hidden shadow-xs ${
                    idx === 0 ? 'border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-200'
                  }`}
                >
                  <div className="h-28 w-full bg-[#F8FAFC] rounded-lg p-2 flex items-center justify-center overflow-hidden mb-2">
                    <img
                      src={imgUrl}
                      alt={`View ${idx + 1}`}
                      className="max-h-full max-w-full object-contain pointer-events-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-slate-600">
                      {idx === 0 ? '★ Primary' : `View ${idx + 1}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(idx)}
                          className="text-[10px] text-amber-700 font-bold hover:underline"
                          title="Set as Main Image"
                        >
                          Make Main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: General Product Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            2. General Product Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. ASUS ROG Zephyrus G16 OLED Gaming Laptop"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Brand Dropdown / Creator */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Brand *</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingBrand(!isCreatingBrand)}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  {isCreatingBrand ? '← Select Existing' : '+ New Brand'}
                </button>
              </div>

              {isCreatingBrand ? (
                <input
                  type="text"
                  placeholder="Enter new brand name (e.g. Corsair)"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-amber-400 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              ) : (
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">Select Brand</option>
                  {brandsList.map((b) => (
                    <option key={b._id || b.slug} value={b._id || b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category Dropdown / Creator */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-[11px] font-bold text-amber-700 hover:underline"
                >
                  {isCreatingCategory ? '← Select Existing' : '+ New Category'}
                </button>
              </div>

              {isCreatingCategory ? (
                <input
                  type="text"
                  placeholder="Enter new category name (e.g. Laptops)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-amber-400 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categoriesList.map((c) => (
                    <option key={c._id || c.slug} value={c._id || c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SKU / Product ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                SKU / Product ID (Optional)
              </label>
              <input
                type="text"
                name="SKU"
                value={formData.SKU}
                onChange={handleChange}
                placeholder="Leave blank to auto-generate"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Model Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Model Number (Optional)
              </label>
              <input
                type="text"
                name="modelNumber"
                value={formData.modelNumber}
                onChange={handleChange}
                placeholder="e.g. GU605MY-QR046WS"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Product Description
              </label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe key features, performance metrics, and build quality..."
                className="w-full bg-[#F8FAFC] border border-slate-200 p-4 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Pricing & Stock Inventory */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            3. Pricing & Warehouse Stock
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="e.g. 189990"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* MRP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                MRP (₹ Original List Price)
              </label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                placeholder="e.g. 219990"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
              {calculateDiscount() > 0 && (
                <span className="text-[10px] font-extrabold text-emerald-700 block">
                  {calculateDiscount()}% Customer Markdown
                </span>
              )}
            </div>

            {/* Stock Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                placeholder="e.g. 25"
                className="w-full bg-[#F8FAFC] border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Hardware Specifications */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                4. Specifications & Technical Specs
              </h2>
              <p className="text-xs text-slate-500">
                Key technical parameters displayed on the product specifications table.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spec Row</span>
            </button>
          </div>

          <div className="space-y-3">
            {specs.map((row, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Key (e.g. GPU, RAM)"
                  value={row.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  className="w-1/3 bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. RTX 4080 12GB, 32GB DDR5)"
                  value={row.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 bg-[#F8FAFC] border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(idx)}
                  className="text-slate-400 hover:text-red-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Merchandising Flags & Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            5. Storefront Badges & Visibility
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Publish Live</span>
                <span className="text-[10px] text-slate-500">Visible to buyers</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Featured Product</span>
                <span className="text-[10px] text-slate-500">Homepage showcase</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                name="isBestSeller"
                checked={formData.isBestSeller}
                onChange={handleChange}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Best Seller</span>
                <span className="text-[10px] text-slate-500">Top ordered ribbon</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                name="isNewArrival"
                checked={formData.isNewArrival}
                onChange={handleChange}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">New Arrival</span>
                <span className="text-[10px] text-slate-500">Fresh stock badge</span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link to="/admin/products">
            <Button type="button" variant="outline" size="sm" className="font-bold text-xs uppercase">
              Cancel
            </Button>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center space-x-2"
          >
            {saving ? 'Publishing Product...' : 'Save & Publish Product →'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddProduct;
