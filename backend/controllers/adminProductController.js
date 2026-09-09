import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { createNotification, notifyBrandOwner } from '../services/notification/notification.service.js';
import { sendCustomEmail } from '../services/email/email.service.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';

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
      if (status === 'Active' || status === 'Approved' || status === 'Live') {
        query.status = { $in: ['Approved', 'published'] };
        query.isActive = true;
      } else if (status === 'Pending' || status === 'Pending Approval') {
        query.status = 'Pending Approval';
      } else if (status === 'Draft') {
        query.status = 'Draft';
      } else if (status === 'Rejected') {
        query.status = 'Rejected';
      } else if (status === 'Inactive') {
        query.$or = [{ status: 'Inactive' }, { isActive: false }];
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
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    if (isProhibitedBrand(name)) {
      return res.status(400).json({
        success: false,
        message: 'Product creation prohibited: Apple and Sony products and brands are not permitted on KAIA Technologies.',
      });
    }

    if (brand && typeof brand === 'string' && isProhibitedBrand(brand)) {
      return res.status(400).json({
        success: false,
        message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
      });
    }

    const finalSellingPrice = Number(sellingPrice ?? price ?? mrp ?? 0);
    const finalMrp = Number(mrp ?? finalSellingPrice);
    const finalStock = Number(stockQuantity ?? (typeof stock === 'object' ? stock?.quantity : stock) ?? 0);

    if (finalSellingPrice < 0) {
      return res.status(400).json({ success: false, message: 'Product price cannot be negative.' });
    }
    if (finalStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
    }

    // 1. Resolve or Create Brand
    let brandId = null;
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        const existingBrandDoc = await Brand.findById(brand);
        if (existingBrandDoc && isProhibitedBrand(existingBrandDoc.name)) {
          return res.status(400).json({
            success: false,
            message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
          });
        }
        brandId = brand;
      } else {
        const brandSlug = slugify(brand);
        if (isProhibitedBrand(brandSlug)) {
          return res.status(400).json({
            success: false,
            message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
          });
        }
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
      if (isProhibitedBrand(name)) {
        return res.status(400).json({
          success: false,
          message: 'Update prohibited: Apple and Sony products and brands are not permitted on KAIA Technologies.',
        });
      }
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
      if (typeof brand === 'string' && isProhibitedBrand(brand)) {
        return res.status(400).json({
          success: false,
          message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
        });
      }
      if (mongoose.Types.ObjectId.isValid(brand)) {
        const existingBrandDoc = await Brand.findById(brand);
        if (existingBrandDoc && isProhibitedBrand(existingBrandDoc.name)) {
          return res.status(400).json({
            success: false,
            message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
          });
        }
        product.brand = brand;
      } else {
        const brandSlug = slugify(brand);
        if (isProhibitedBrand(brandSlug)) {
          return res.status(400).json({
            success: false,
            message: 'Brand prohibited: Apple and Sony brands are not permitted on KAIA Technologies.',
          });
        }
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
    if (mrp !== undefined) {
      const parsedMrp = Number(mrp);
      if (parsedMrp < 0) return res.status(400).json({ success: false, message: 'MRP cannot be negative.' });
      product.mrp = parsedMrp;
    }
    if (sellingPrice !== undefined || price !== undefined) {
      const parsedPrice = Number(sellingPrice ?? price);
      if (parsedPrice < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative.' });
      product.sellingPrice = parsedPrice;
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

    if (specifications !== undefined) {
      product.specifications = specifications;
      product.markModified('specifications');
    }
    if (status !== undefined) product.status = status;
    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);
    if (isBestDeal !== undefined) product.isBestDeal = Boolean(isBestDeal);
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

// @desc    Delete a product (Soft delete by default, hard delete if ?hard=true)
// @route   DELETE /api/admin/products/:id
// @access  Private (ADMIN)
export const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (hard === 'true') {
      await Product.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: 'Product permanently removed from database.',
      });
    }

    product.isDeleted = true;
    product.isActive = false;
    product.status = 'Inactive';
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' deactivated and removed from customer catalog.`,
    });
  } catch (error) {
    console.error('Admin product deletion error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
};

// @desc    Update product stock
// @route   PATCH /api/admin/products/:id/stock
// @route   PATCH /api/products/:id/stock
// @access  Private (ADMIN / Brand)
export const updateAdminProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, quantity, stockQuantity } = req.body;

    const rawStock = stockQuantity ?? quantity ?? (typeof stock === 'object' ? stock?.quantity : stock);
    if (rawStock === undefined || rawStock === null || isNaN(Number(rawStock))) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock quantity is required.' });
    }

    const newStock = Math.max(0, Number(rawStock));

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.stock = {
      ...product.stock,
      quantity: newStock,
      availableQuantity: Math.max(0, newStock - (product.stock?.reservedQuantity || 0)),
    };
    product.stockQuantity = newStock;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Stock updated to ${newStock} units for '${product.name}'.`,
      product,
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ success: false, message: 'Server error updating stock.' });
  }
};

// @desc    Toggle product active / inactive status or update flags
// @route   PATCH /api/admin/products/:id/status
// @route   PATCH /api/products/:id/status
// @access  Private (ADMIN / Brand)
export const toggleAdminProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, status, isFeatured, isBestSeller, isNewArrival, isBestDeal, rejectionReason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStatus = product.status;

    // Handle Status
    if (status !== undefined) {
      product.status = status;
      if (status === 'Approved' || status === 'published') {
        product.isActive = true;
        product.approvedAt = new Date();
        product.rejectionReason = '';
      } else if (status === 'Rejected') {
        product.isActive = false;
        if (rejectionReason) product.rejectionReason = rejectionReason.trim();
      } else if (['Draft', 'Pending Approval', 'Inactive'].includes(status)) {
        product.isActive = false;
      }
    }

    // Handle Active flag explicitly if provided
    if (isActive !== undefined) {
      product.isActive = Boolean(isActive);
      if (product.isActive && (!product.status || product.status === 'Inactive' || product.status === 'Draft')) {
        product.status = 'Approved';
        product.approvedAt = new Date();
      } else if (!product.isActive && product.status === 'Approved') {
        product.status = 'Inactive';
      }
    }

    // Handle Merchandising Flags
    if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
    if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
    if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);
    if (isBestDeal !== undefined) product.isBestDeal = Boolean(isBestDeal);

    // If nothing provided at all, simple toggle
    if (
      status === undefined &&
      isActive === undefined &&
      isFeatured === undefined &&
      isBestSeller === undefined &&
      isNewArrival === undefined &&
      isBestDeal === undefined
    ) {
      product.isActive = !product.isActive;
      product.status = product.isActive ? 'Approved' : 'Inactive';
      if (product.isActive) product.approvedAt = new Date();
    }

    await product.save();

    // Trigger Notifications & Audit Log on status transition
    if (previousStatus !== product.status) {
      try {
        const brand = await Brand.findById(product.brand);
        if (brand && brand.owner) {
          if (product.status === 'Approved') {
            await createNotification({
              userId: brand.owner,
              title: 'Product Approved',
              message: `Your product "${product.name}" (SKU: ${product.SKU || product.modelNumber || 'Listing'}) has been approved and is now live on the KAIA storefront.`,
              type: 'BRAND',
              referenceType: 'Product',
              referenceId: product._id,
              link: `/vendor/products`,
            });

            if (brand.contactEmail) {
              await sendCustomEmail({
                to: brand.contactEmail,
                subject: `Product Approved: ${product.name}`,
                html: `<h2>Congratulations!</h2><p>Your product listing <strong>${product.name}</strong> (SKU: ${product.SKU}) has been approved by KAIA Administration and published live to the platform storefront.</p><p><a href="${process.env.FRONTEND_URL || 'https://kaia-kenzo.vercel.app'}/product/${product.slug}">View Live Product on Storefront</a></p>`,
              }).catch((e) => console.error('[Notification] Email delivery warning:', e.message));
            }
          } else if (product.status === 'Rejected') {
            const reasonText = product.rejectionReason || 'Product specifications or images need verification.';
            await createNotification({
              userId: brand.owner,
              title: 'Product Rejected',
              message: `Your product "${product.name}" was rejected. Reason: ${reasonText}`,
              type: 'BRAND',
              referenceType: 'Product',
              referenceId: product._id,
              link: `/vendor/products`,
            });

            if (brand.contactEmail) {
              await sendCustomEmail({
                to: brand.contactEmail,
                subject: `Product Listing Status: ${product.name}`,
                html: `<h2>Product Listing Rejected</h2><p>Your product submission for <strong>${product.name}</strong> was rejected during administrative review.</p><p><strong>Rejection Reason:</strong> ${reasonText}</p><p>Please review and update the product in your Vendor Dashboard to resubmit.</p>`,
              }).catch((e) => console.error('[Notification] Email delivery warning:', e.message));
            }
          }
        }

        // Audit Logging
        if (req.user && req.user._id) {
          await AuditLog.create({
            user: req.user._id,
            action: product.status === 'Approved' ? 'APPROVE_PRODUCT' : product.status === 'Rejected' ? 'REJECT_PRODUCT' : 'UPDATE_PRODUCT_STATUS',
            entity: 'Product',
            entityId: product._id,
            changes: { status: product.status, isActive: product.isActive, rejectionReason: product.rejectionReason },
            metadata: { ip: req.ip || '', userAgent: req.headers['user-agent'] || '' },
          }).catch((e) => console.error('[Audit] Log creation warning:', e.message));
        }
      } catch (notifErr) {
        console.error('[Notification] Error during approval dispatch:', notifErr);
      }
    }

    const populated = await Product.findById(product._id)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' status/flags updated successfully.`,
      product: populated || product,
    });
  } catch (error) {
    console.error('Error updating product status/flags:', error);
    res.status(500).json({ success: false, message: 'Server error updating product status.' });
  }
};

// @desc    Add image(s) to product
// @route   POST /api/admin/products/:id/images
// @route   POST /api/products/:id/images
// @access  Private (ADMIN / Brand)
export const addAdminProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, images } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const currentImages = Array.isArray(product.images) ? [...product.images] : [];
    const toAdd = Array.isArray(images) ? images : url ? [url] : [];

    if (toAdd.length === 0) {
      return res.status(400).json({ success: false, message: 'No image URLs provided.' });
    }

    toAdd.forEach((img, idx) => {
      if (typeof img === 'string') {
        currentImages.push({
          url: img,
          altText: `${product.name} - Additional View`,
          isPrimary: currentImages.length === 0 && idx === 0,
        });
      } else if (img && img.url) {
        currentImages.push(img);
      }
    });

    product.images = currentImages;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Images added successfully.',
      images: product.images,
    });
  } catch (error) {
    console.error('Error adding product images:', error);
    res.status(500).json({ success: false, message: 'Server error adding images.' });
  }
};

// @desc    Delete image from product
// @route   DELETE /api/admin/products/:id/images/:imageId
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (ADMIN / Brand)
export const deleteAdminProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const initialLength = product.images.length;
    product.images = product.images.filter((img) => {
      if (img._id && img._id.toString() === imageId) return false;
      if (img.url && img.url.includes(imageId)) return false;
      return true;
    });

    if (product.images.length === initialLength && product.images.length > 0 && !isNaN(Number(imageId))) {
      product.images.splice(Number(imageId), 1);
    }

    if (product.images.length > 0 && !product.images.some((img) => img.isPrimary)) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image removed successfully.',
      images: product.images,
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ success: false, message: 'Server error deleting image.' });
  }
};

// @desc    Approve / Verify pending product
// @route   PUT /api/admin/products/:id/verify
// @access  Private (ADMIN)
export const verifyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, isApproved, status, rejectionReason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const finalStatus = status || (approvalStatus === 'Approved' || isApproved ? 'Approved' : 'Rejected');
    product.status = finalStatus;
    product.isActive = finalStatus === 'Approved';
    if (product.isActive) {
      product.approvedAt = new Date();
      product.rejectionReason = '';
    } else if (finalStatus === 'Rejected') {
      product.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Product details require verification';
    }

    await product.save();

    // Trigger Notification
    try {
      const brand = await Brand.findById(product.brand);
      if (brand && brand.owner) {
        if (finalStatus === 'Approved') {
          await createNotification({
            userId: brand.owner,
            title: 'Product Approved',
            message: `Your product "${product.name}" has been approved by administrator.`,
            type: 'BRAND',
            referenceType: 'Product',
            referenceId: product._id,
            link: '/vendor/products',
          });
        } else if (finalStatus === 'Rejected') {
          await createNotification({
            userId: brand.owner,
            title: 'Product Rejected',
            message: `Your product "${product.name}" was rejected. Reason: ${product.rejectionReason}`,
            type: 'BRAND',
            referenceType: 'Product',
            referenceId: product._id,
            link: '/vendor/products',
          });
        }
      }
    } catch (e) {
      console.error('[Notification] Verification dispatch error:', e.message);
    }

    res.status(200).json({
      success: true,
      message: `Product status updated to '${finalStatus}'.`,
      product,
    });
  } catch (error) {
    console.error('Error verifying product:', error);
    res.status(500).json({ success: false, message: 'Server error verifying product.' });
  }
};
