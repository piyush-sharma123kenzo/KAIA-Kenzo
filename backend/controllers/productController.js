import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Safe regex string sanitizer to prevent ReDoS / MongoDB operator injection
const escapeRegex = (text = '') => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// ==========================================
// 1. PRODUCT CATALOG WITH FACETED FILTERS & SEARCH
// ==========================================

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      brand,
      category,
      minPrice,
      maxPrice,
      rating,
      discount,
      availability,
      featured,
      newArrivals,
      bestSellers,
      sort,
      page = 1,
      limit = 12,
      // Dynamic hardware specification filters
      processor,
      ram,
      storage,
      gpu,
      display,
      refreshRate,
      os,
      connectivity,
    } = req.query;

    const query = {
      isActive: true,
      status: { $in: ['Approved', 'published'] },
    };

    // 1. Safe Search Filter across Name, Model, SKU, Description, Brand & Category
    if (search && typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');

      const [matchingBrands, matchingCats] = await Promise.all([
        Brand.find({ name: searchRegex, status: { $in: ['Approved', 'approved'] } }).select('_id'),
        Category.find({ name: searchRegex }).select('_id'),
      ]);

      const brandIds = matchingBrands.map((b) => b._id);
      const catIds = matchingCats.map((c) => c._id);

      query.$or = [
        { name: searchRegex },
        { modelNumber: searchRegex },
        { SKU: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        ...(brandIds.length > 0 ? [{ brand: { $in: brandIds } }] : []),
        ...(catIds.length > 0 ? [{ category: { $in: catIds } }] : []),
      ];
    }

    // 2. Multi-Brand Filter (supports slug, name, or ObjectId case-insensitively)
    if (brand && typeof brand === 'string' && brand.trim()) {
      const brandTokens = brand.split(',').map((s) => s.trim()).filter(Boolean);
      const validObjectIds = brandTokens.filter((s) => mongoose.Types.ObjectId.isValid(s));
      const brandRegexes = brandTokens.map((t) => new RegExp(`^${t}$`, 'i'));

      const foundBrands = await Brand.find({
        $or: [
          { slug: { $in: brandRegexes } },
          { name: { $in: brandRegexes } },
          ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
        ],
      }).select('_id');

      const brandIds = foundBrands.map((b) => b._id);
      if (brandIds.length > 0) {
        query.brand = { $in: brandIds };
      } else {
        // If brand doesn't exist, return empty result safely
        query.brand = new mongoose.Types.ObjectId();
      }
    }

    // 3. Category Filter (supports parent category + its subcategories)
    if (category && typeof category === 'string' && category.trim()) {
      const catTokens = category.split(',').map((s) => s.trim()).filter(Boolean);
      const validObjectIds = catTokens.filter((s) => mongoose.Types.ObjectId.isValid(s));

      const foundCats = await Category.find({
        $or: [
          { slug: { $in: catTokens } },
          ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
        ],
      }).select('_id');

      const directCatIds = foundCats.map((c) => c._id);

      if (directCatIds.length > 0) {
        // Include child subcategories whose parentCategory matches
        const subCats = await Category.find({ parentCategory: { $in: directCatIds } }).select('_id');
        const allCatIds = [...directCatIds, ...subCats.map((sc) => sc._id)];
        query.category = { $in: allCatIds };
      } else {
        query.category = new mongoose.Types.ObjectId();
      }
    }

    // 4. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.sellingPrice = {};
      if (minPrice && !isNaN(Number(minPrice))) query.sellingPrice.$gte = Math.max(0, Number(minPrice));
      if (maxPrice && !isNaN(Number(maxPrice))) query.sellingPrice.$lte = Math.max(0, Number(maxPrice));
    }

    // 5. Minimum Rating Filter
    if (rating && !isNaN(Number(rating))) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // 6. Discount Filter (e.g. discount >= 20%)
    if (discount && !isNaN(Number(discount))) {
      const minDisc = Number(discount);
      query.$expr = {
        $gte: [
          {
            $multiply: [
              { $divide: [{ $subtract: ['$mrp', '$sellingPrice'] }, { $cond: [{ $eq: ['$mrp', 0] }, 1, '$mrp'] }] },
              100,
            ],
          },
          minDisc,
        ],
      };
    }

    // 7. Availability Filter (Real Database Inventory)
    if (availability === 'inStock' || availability === 'in' || availability === 'true') {
      query.$or = [
        { 'stock.availableQuantity': { $gt: 0 } },
        { stockQuantity: { $gt: 0 } },
      ];
    } else if (availability === 'outOfStock' || availability === 'out') {
      query.$and = [
        { $or: [{ 'stock.availableQuantity': { $lte: 0 } }, { 'stock.availableQuantity': { $exists: false } }] },
        { $or: [{ stockQuantity: { $lte: 0 } }, { stockQuantity: { $exists: false } }] },
      ];
    }

    // 8. Collections & Flags
    if (featured === 'true' || featured === true) query.isFeatured = true;
    if (newArrivals === 'true' || newArrivals === true) query.isNewArrival = true;
    if (bestSellers === 'true' || bestSellers === true) query.isBestSeller = true;

    // 9. Hardware Dynamic Specification Filters
    if (processor) query['specifications.Processor'] = new RegExp(escapeRegex(processor), 'i');
    if (ram) query['specifications.RAM'] = new RegExp(escapeRegex(ram), 'i');
    if (storage) query['specifications.Storage'] = new RegExp(escapeRegex(storage), 'i');
    if (gpu) query['specifications.GPU'] = new RegExp(escapeRegex(gpu), 'i');
    if (display) query['specifications.Display'] = new RegExp(escapeRegex(display), 'i');
    if (refreshRate) query['specifications.Refresh Rate'] = new RegExp(escapeRegex(refreshRate), 'i');
    if (os) query['specifications.Operating System'] = new RegExp(escapeRegex(os), 'i');
    if (connectivity) query['specifications.Connectivity'] = new RegExp(escapeRegex(connectivity), 'i');

    // 10. Server-Side Sorting
    let sortQuery = { createdAt: -1 }; // default newest
    if (sort) {
      if (sort === 'price-low' || sort === 'priceLowToHigh' || sort === 'price_asc') {
        sortQuery = { sellingPrice: 1 };
      } else if (sort === 'price-high' || sort === 'priceHighToLow' || sort === 'price_desc') {
        sortQuery = { sellingPrice: -1 };
      } else if (sort === 'rating' || sort === 'top-rated') {
        sortQuery = { 'ratings.average': -1, 'ratings.count': -1 };
      } else if (sort === 'best-selling' || sort === 'bestSelling' || sort === 'popular') {
        sortQuery = { 'ratings.count': -1, createdAt: -1 };
      } else if (sort === 'newest') {
        sortQuery = { createdAt: -1 };
      } else if (sort === 'oldest') {
        sortQuery = { createdAt: 1 };
      } else if (sort === 'discount-high' || sort === 'discount') {
        sortQuery = { mrp: -1, sellingPrice: 1 };
      }
    }

    // 11. Pagination Math
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Parallel execution: count, products list, and facet counts for brand/category sidebar
    const [total, products, facetBrands, facetCategories] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('brand', 'name slug logo banner description')
        .populate('category', 'name slug description image')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      // Aggregate brand counts for currently active base query (without brand filter)
      Product.aggregate([
        { $match: { isActive: true, status: { $in: ['Approved', 'published'] } } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brandInfo' } },
        { $unwind: '$brandInfo' },
        { $project: { _id: 1, name: '$brandInfo.name', slug: '$brandInfo.slug', count: 1 } },
        { $sort: { count: -1 } },
      ]),
      // Aggregate category counts
      Product.aggregate([
        { $match: { isActive: true, status: { $in: ['Approved', 'published'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'catInfo' } },
        { $unwind: '$catInfo' },
        { $project: { _id: 1, name: '$catInfo.name', slug: '$catInfo.slug', count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      products,
      facets: {
        brands: facetBrands,
        categories: facetCategories,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      // Backward compatibility aliases
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      count: products.length,
      currentPage: pageNum,
      pages: totalPages,
    });
  } catch (error) {
    console.error('Error in getProducts API:', error);
    res.status(500).json({ message: 'Server error fetching products catalog.' });
  }
};

// ==========================================
// 2. AUTOCOMPLETE SEARCH SUGGESTIONS
// ==========================================

export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const sanitized = escapeRegex(q.trim());
    const regex = new RegExp(sanitized, 'i');

    const [products, brands, categories] = await Promise.all([
      Product.find({ name: regex, isActive: true, status: { $in: ['Approved', 'published'] } })
        .select('name slug images sellingPrice mrp brand category')
        .populate('brand', 'name slug')
        .populate('category', 'name slug')
        .limit(6),
      Brand.find({ name: regex, status: { $in: ['Approved', 'approved'] } })
        .select('name slug logo')
        .limit(3),
      Category.find({ name: regex, isActive: true })
        .select('name slug image')
        .limit(3),
    ]);

    const suggestions = [
      ...products.map((p) => ({
        type: 'product',
        title: p.name,
        slug: p.slug,
        image: p.images?.[0]?.url || p.images?.[0] || '',
        price: p.sellingPrice,
        brand: p.brand?.name,
        category: p.category?.name,
      })),
      ...brands.map((b) => ({
        type: 'brand',
        title: b.name,
        slug: b.slug,
        logo: b.logo,
      })),
      ...categories.map((c) => ({
        type: 'category',
        title: c.name,
        slug: c.slug,
      })),
    ];

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    res.status(500).json({ message: 'Server error fetching suggestions.' });
  }
};

// ==========================================
// 3. PRODUCT DETAILS BY SLUG
// ==========================================

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const query = mongoose.Types.ObjectId.isValid(slug)
      ? { $or: [{ _id: slug }, { slug }] }
      : { slug };

    const product = await Product.findOne(query)
      .populate('brand', 'name slug logo banner description contactEmail warrantyPolicy')
      .populate('category', 'name slug description image baseCommission');

    if (!product) {
      return res.status(404).json({ message: 'Product not found on the platform.' });
    }

    // Compute stock status & scarcity messaging
    const availableQty = product.stock?.availableQuantity ?? product.stockQuantity ?? 0;
    let stockStatus = 'In Stock';
    let stockLevel = 'normal';

    if (availableQty <= 0) {
      stockStatus = 'Currently unavailable';
      stockLevel = 'out_of_stock';
    } else if (availableQty <= 5) {
      stockStatus = `Only ${availableQty} left in stock - order soon`;
      stockLevel = 'low_stock';
    }

    // Compute discount percentage
    let discountPercentage = 0;
    if (product.mrp && product.sellingPrice && product.mrp > product.sellingPrice) {
      discountPercentage = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);
    }

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        stockStatus,
        stockLevel,
        availableQuantity: availableQty,
        discountPercentage,
      },
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Server error fetching product details.' });
  }
};

// ==========================================
// 4. RELATED PRODUCTS & FREQUENTLY BOUGHT TOGETHER
// ==========================================

export const getRelatedProducts = async (req, res) => {
  try {
    const { slug } = req.params;

    const targetProduct = await Product.findOne({ slug }).select('_id category brand specifications');
    if (!targetProduct) {
      return res.status(404).json({ message: 'Target product not found.' });
    }

    // Find products in same category or brand, excluding self
    const related = await Product.find({
      _id: { $ne: targetProduct._id },
      $or: [
        { category: targetProduct.category },
        { brand: targetProduct.brand },
      ],
      isActive: true,
      status: { $in: ['Approved', 'published'] },
    })
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .limit(6);

    res.status(200).json({ success: true, related });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Server error fetching related products.' });
  }
};

// ==========================================
// 5. BEST SELLERS, NEW ARRIVALS & DEALS
// ==========================================

export const getBestSellers = async (req, res) => {
  try {
    const limit = Math.min(24, parseInt(req.query.limit, 10) || 8);
    const products = await Product.find({
      isActive: true,
      status: { $in: ['Approved', 'published'] },
    })
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ 'ratings.count': -1, isBestSeller: -1, createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching best sellers.' });
  }
};

export const getNewArrivals = async (req, res) => {
  try {
    const limit = Math.min(24, parseInt(req.query.limit, 10) || 8);
    const products = await Product.find({
      isActive: true,
      status: { $in: ['Approved', 'published'] },
    })
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching new arrivals.' });
  }
};

export const getDeals = async (req, res) => {
  try {
    const limit = Math.min(24, parseInt(req.query.limit, 10) || 8);
    // Return products where mrp > sellingPrice
    const products = await Product.find({
      isActive: true,
      status: { $in: ['Approved', 'published'] },
      $expr: { $gt: ['$mrp', '$sellingPrice'] },
    })
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .sort({ mrp: -1 })
      .limit(limit);

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deals.' });
  }
};

// ==========================================
// 6. PRODUCT REVIEWS DISTRIBUTION & LIST
// ==========================================

export const getProductReviewsDistribution = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Resolve productId if slug was passed
    let pId = productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ slug: productId }).select('_id');
      if (prod) pId = prod._id;
    }

    const sortOption = sort === 'highest' ? { rating: -1 } : sort === 'lowest' ? { rating: 1 } : { createdAt: -1 };

    const [reviews, total, breakdown] = await Promise.all([
      Review.find({ product: pId, isHidden: false })
        .populate('user', 'name avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ product: pId, isHidden: false }),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(pId), isHidden: false } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdown.forEach((b) => {
      if (distribution[b._id] !== undefined) distribution[b._id] = b.count;
    });

    const averageRating = total > 0
      ? Math.round((breakdown.reduce((sum, b) => sum + (b._id * b.count), 0) / total) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      reviews,
      total,
      averageRating,
      distribution,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('Error fetching review distribution:', error);
    res.status(500).json({ message: 'Error retrieving review distribution.' });
  }
};

// ==========================================
// 7. BRAND SELLER PRODUCT MANAGEMENT (CRUD)
// ==========================================

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ brand: req.brand._id })
      .populate('category', 'name slug');
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching brand products:', error);
    res.status(500).json({ message: 'Server error fetching your products.' });
  }
};

export const createProduct = async (req, res) => {
  const { name, modelNumber, SKU, category, description, mrp, sellingPrice, gstRate, images, stock, specifications } = req.body;

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 10000);

    const skuExists = await Product.findOne({ SKU });
    if (skuExists) {
      return res.status(400).json({ message: 'Product SKU already exists on the platform.' });
    }

    const product = await Product.create({
      brand: req.brand._id,
      name,
      slug,
      modelNumber,
      SKU,
      category,
      description,
      mrp,
      sellingPrice,
      gstRate: gstRate || 18.0,
      images,
      stock: {
        quantity: stock?.quantity || 0,
        reservedQuantity: 0,
        availableQuantity: stock?.quantity || 0,
        reorderThreshold: stock?.reorderThreshold || 5,
      },
      specifications: specifications || {},
      status: 'Pending Approval',
    });

    res.status(201).json({
      success: true,
      message: 'Product listing submitted for approval. An administrator will review it shortly.',
      product,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Server error during product creation.' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, modelNumber, category, description, mrp, sellingPrice, gstRate, images, stock, specifications } = req.body;

  try {
    const product = await Product.findOne({ _id: id, brand: req.brand._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }

    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 10000);
    }
    if (modelNumber) product.modelNumber = modelNumber;
    if (category) product.category = category;
    if (description) product.description = description;
    if (mrp) product.mrp = mrp;
    if (sellingPrice) product.sellingPrice = sellingPrice;
    if (gstRate !== undefined) product.gstRate = gstRate;
    if (images) product.images = images;
    if (stock) {
      if (stock.quantity !== undefined) product.stock.quantity = stock.quantity;
      if (stock.reorderThreshold !== undefined) product.stock.reorderThreshold = stock.reorderThreshold;
    }
    if (specifications) product.specifications = specifications;

    product.status = 'Pending Approval';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully and resubmitted for admin approval.',
      product,
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Server error during product updates.' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findOneAndDelete({ _id: id, brand: req.brand._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Server error during product deletion.' });
  }
};
