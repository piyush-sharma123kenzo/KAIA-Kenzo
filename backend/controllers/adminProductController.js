import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

// Helper to generate clean slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// @desc    Get all products for admin table
// @route   GET /api/admin/products
// @access  Private (ADMIN)
export const getAdminProducts = async (req, res) => {
  try {
    const { search, brand, category, status, sort = 'newest', page = 1, limit = 20 } = req.query;

    const query = {};

    // Search query
    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: sRegex },
        { SKU: sRegex },
        { modelNumber: sRegex },
        { slug: sRegex },
      ];
    }

    // Brand filter
    if (brand && brand.trim()) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        query.brand = brand;
      } else {
        const foundBrand = await Brand.findOne({
          $or: [{ slug: brand.toLowerCase() }, { name: new RegExp(`^${brand}$`, 'i') }],
        });
        if (foundBrand) query.brand = foundBrand._id;
      }
    }

    // Category filter
    if (category && category.trim()) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
        });
        if (foundCat) query.category = foundCat._id;
      }
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'Active' || status === 'Approved') {
        query.status = { $in: ['Approved', 'published'] };
        query.isActive = true;
      } else if (status === 'Inactive') {
        query.$or = [{ status: 'Inactive' }, { isActive: false }];
      } else if (status === 'Pending') {
        query.status = 'Pending Approval';
      }
    }

    // Sort order
    let sortOrder = { createdAt: -1 };
    if (sort === 'oldest') sortOrder = { createdAt: 1 };
    if (sort === 'price_asc') sortOrder = { sellingPrice: 1 };
    if (sort === 'price_desc') sortOrder = { sellingPrice: -1 };
    if (sort === 'stock_low') sortOrder = { 'stock.availableQuantity': 1 };
    if (sort === 'name_asc') sortOrder = { name: 1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('brand', 'name slug logo')
        .populate('category', 'name slug')
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Format products for table display
    const formatted = products.map((p) => ({
      ...p,
      price: p.sellingPrice || p.price || 0,
      stockCount: p.stock?.availableQuantity ?? p.stockQuantity ?? p.stock?.quantity ?? 0,
      imageUrl: p.images?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : '') || p.image || '',
    }));

    res.status(200).json({
      success: true,
      products: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Server error retrieving product catalog.' });
  }
};

// @desc    Get single product details for editing
// @route   GET /api/admin/products/:id
// @access  Private (ADMIN)
export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const product = await Product.findOne(query)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({
      success: true,
      product: product.toObject(),
    });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    res.status(500).json({ message: 'Server error retrieving product details.' });
  }
};

// @desc    Create a new product by Admin (Instantly live)
// @route   POST /api/admin/products
// @access  Private (ADMIN)
export const createAdminProduct = async (req, res) => {
  try {
    const {
      name,
      brand, // ID or Name
      category, // ID or Name
      description,
      mrp,
      price,
      sellingPrice,
      stock,
      stockQuantity,
      SKU,
      modelNumber,
      images,
      specifications,
      status = 'Approved',
      isActive = true,
      isFeatured = false,
      isBestSeller = false,
      isNewArrival = false,
      gstRate = 18.0,
      warrantySummary,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    // 1. Resolve or Create Brand
    let brandId = null;
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        brandId = brand;
      } else {
        const brandSlug = slugify(brand);
        let existingBrand = await Brand.findOne({
          $or: [{ slug: brandSlug }, { name: new RegExp(`^${brand.trim()}$`, 'i') }],
        });

        if (!existingBrand) {
          existingBrand = await Brand.create({
            name: brand.trim(),
            slug: brandSlug,
            description: `${brand.trim()} official hardware and electronics.`,
            status: 'Approved',
            isActive: true,
          });
        }
        brandId = existingBrand._id;
      }
    }

    // 2. Resolve or Create Category
    let categoryId = null;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        const catSlug = slugify(category);
        let existingCat = await Category.findOne({
          $or: [{ slug: catSlug }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
        });

        if (!existingCat) {
          existingCat = await Category.create({
            name: category.trim(),
            slug: catSlug,
            description: `${category.trim()} category.`,
            isActive: true,
          });
        }
        categoryId = existingCat._id;
      }
    }

    // 3. Format Images array
    let formattedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, altText: `${name} - View ${idx + 1}`, isPrimary: idx === 0 };
        }
        return {
          url: img.url || '',
          altText: img.altText || `${name} - View ${idx + 1}`,
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
        };
      });
    }

    // 4. Generate unique slug
    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    // 5. SKU generation if not provided
    const finalSku = SKU && SKU.trim()
      ? SKU.trim()
      : `KAIA-${(brand ? slugify(brand.toString()) : 'GEN').toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 6. Pricing & Stock
    const finalSellingPrice = Number(sellingPrice ?? price ?? mrp ?? 0);
    const finalMrp = Number(mrp ?? finalSellingPrice);
    const finalStock = Number(stockQuantity ?? (typeof stock === 'object' ? stock?.quantity : stock) ?? 10);

    const product = await Product.create({
      name: name.trim(),
      slug: finalSlug,
      brand: brandId,
      category: categoryId,
      description: description || '',
      mrp: finalMrp,
      sellingPrice: finalSellingPrice,
      gstRate: Number(gstRate) || 18.0,
      SKU: finalSku,
      modelNumber: modelNumber || finalSku,
      images: formattedImages,
      stock: {
        quantity: finalStock,
        reservedQuantity: 0,
        availableQuantity: finalStock,
        reorderThreshold: 5,
      },
      stockQuantity: finalStock,
      specifications: specifications || {},
      status: status || 'Approved',
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      isNewArrival: Boolean(isNewArrival),
      warrantySummary: warrantySummary || '1 Year Manufacturer Limited Warranty',
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created and published live to website successfully.',
      product: populatedProduct,
    });
  } catch (error) {
    console.error('Admin product creation error:', error);
    res.status(500).json({ message: error.message || 'Server error creating product.' });
  }
};

// @desc    Update existing product
// @route   PUT /api/admin/products/:id
// @access  Private (ADMIN)
export const updateAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      category,
      description,
      mrp,
      price,
      sellingPrice,
      stock,
      stockQuantity,
      SKU,
      modelNumber,
      images,
      specifications,
      status,
      isActive,
      isFeatured,
      isBestSeller,
      isNewArrival,
      gstRate,
      warrantySummary,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (name && name.trim()) {
      product.name = name.trim();
      // Only regenerate slug if name changed significantly
      if (slugify(name) !== product.slug) {
        let baseSlug = slugify(name);
        let finalSlug = baseSlug;
        let count = 1;
        while (await Product.findOne({ slug: finalSlug, _id: { $ne: product._id } })) {
          finalSlug = `${baseSlug}-${count++}`;
        }
        product.slug = finalSlug;
      }
    }

    // Brand resolution
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        product.brand = brand;
      } else {
        const brandSlug = slugify(brand);
        let existingBrand = await Brand.findOne({
          $or: [{ slug: brandSlug }, { name: new RegExp(`^${brand.trim()}$`, 'i') }],
        });
        if (!existingBrand) {
          existingBrand = await Brand.create({
            name: brand.trim(),
            slug: brandSlug,
            status: 'Approved',
            isActive: true,
          });
        }
        product.brand = existingBrand._id;
      }
    }

    // Category resolution
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        product.category = category;
      } else {
        const catSlug = slugify(category);
        let existingCat = await Category.findOne({
          $or: [{ slug: catSlug }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
        });
        if (!existingCat) {
          existingCat = await Category.create({
            name: category.trim(),
            slug: catSlug,
            isActive: true,
          });
        }
        product.category = existingCat._id;
      }
    }

    if (description !== undefined) product.description = description;
    if (mrp !== undefined) product.mrp = Number(mrp);
    if (sellingPrice !== undefined || price !== undefined) {
      product.sellingPrice = Number(sellingPrice ?? price);
    }
    if (gstRate !== undefined) product.gstRate = Number(gstRate);
    if (SKU !== undefined) product.SKU = SKU;
    if (modelNumber !== undefined) product.modelNumber = modelNumber;

    // Stock update
    if (stock !== undefined || stockQuantity !== undefined) {
      const qty = Number(stockQuantity ?? (typeof stock === 'object' ? stock?.quantity : stock));
      product.stock = {
        ...product.stock,
        quantity: qty,
        availableQuantity: qty,
      };
      product.stockQuantity = qty;
    }

    // Images
    if (Array.isArray(images)) {
      product.images = images.map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, altText: `${product.name} - View ${idx + 1}`, isPrimary: idx === 0 };
        }
        return {
          url: img.url || '',
          altText: img.altText || `${product.name} - View ${idx + 1}`,
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
        };
      });
    }

    if (specifications !== undefined) product.specifications = specifications;
    if (status !== undefined) product.status = status;
    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);
    if (warrantySummary !== undefined) product.warrantySummary = warrantySummary;

    await product.save();

    const updated = await Product.findById(product._id)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error) {
    console.error('Admin product update error:', error);
    res.status(500).json({ message: error.message || 'Server error updating product.' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private (ADMIN)
export const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted from database and live storefront.',
    });
  } catch (error) {
    console.error('Admin product deletion error:', error);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
};
