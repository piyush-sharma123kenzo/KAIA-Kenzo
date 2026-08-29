import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

// @desc    Get all products with advanced filtering & sorting
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      brand,
      category,
      minPrice,
      maxPrice,
      rating,
      sort,
      page = 1,
      limit = 12,
      // Dynamic specs filters
      processor,
      ram,
      storage,
      gpu,
      display,
    } = req.query;

    const query = { status: 'Approved' };

    // 1. Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Let's find brands matching search
      const matchingBrands = await Brand.find({ name: searchRegex });
      const brandIds = matchingBrands.map(b => b._id);

      // Find categories matching search
      const matchingCats = await Category.find({ name: searchRegex });
      const catIds = matchingCats.map(c => c._id);

      query.$or = [
        { name: searchRegex },
        { modelNumber: searchRegex },
        { SKU: searchRegex },
        { description: searchRegex },
        { brand: { $in: brandIds } },
        { category: { $in: catIds } },
      ];
    }

    // 2. Brand filter (handles comma separated slugs, e.g. brand=asus,apple)
    if (brand) {
      const brandSlugs = brand.split(',');
      const foundBrands = await Brand.find({ slug: { $in: brandSlugs } });
      const brandIds = foundBrands.map(b => b._id);
      query.brand = { $in: brandIds };
    }

    // 3. Category filter (comma separated slugs)
    if (category) {
      const catSlugs = category.split(',');
      const foundCats = await Category.find({ slug: { $in: catSlugs } });
      const catIds = foundCats.map(c => c._id);
      
      // Support subcategories: find any category whose parent is one of these
      const subCats = await Category.find({ parentCategory: { $in: catIds } });
      const allCatIds = [...catIds, ...subCats.map(sc => sc._id)];
      
      query.category = { $in: allCatIds };
    }

    // 4. Price range filter
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }

    // 5. Rating filter
    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // 6. Dynamic Specifications filters (case-insensitive regex matching)
    if (processor) {
      query['specifications.Processor'] = new RegExp(processor, 'i');
    }
    if (ram) {
      query['specifications.RAM'] = new RegExp(ram, 'i');
    }
    if (storage) {
      query['specifications.Storage'] = new RegExp(storage, 'i');
    }
    if (gpu) {
      query['specifications.GPU'] = new RegExp(gpu, 'i');
    }
    if (display) {
      query['specifications.Display'] = new RegExp(display, 'i');
    }

    // Sorting options
    let sortQuery = { createdAt: -1 }; // default: new arrivals
    if (sort) {
      if (sort === 'price_asc') sortQuery = { sellingPrice: 1 };
      else if (sort === 'price_desc') sortQuery = { sellingPrice: -1 };
      else if (sort === 'rating') sortQuery = { 'ratings.average': -1 };
      else if (sort === 'oldest') sortQuery = { createdAt: 1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('brand', 'name slug logo')
      .populate('category', 'name slug')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (error) {
    console.error('Error in getProducts API:', error);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
};

// @desc    Get autocomplete search suggestions
// @route   GET /api/products/search/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.status(200).json({ suggestions: [] });
  }

  try {
    const regex = new RegExp(q, 'i');
    // Find products matching query (limit 5)
    const products = await Product.find({ name: regex, status: 'Approved' })
      .select('name slug category')
      .populate('category', 'name')
      .limit(5);

    // Find brands matching query (limit 3)
    const brands = await Brand.find({ name: regex, status: 'Approved' })
      .select('name slug')
      .limit(3);

    const suggestions = [
      ...products.map(p => ({ type: 'product', text: p.name, slug: p.slug })),
      ...brands.map(b => ({ type: 'brand', text: b.name, slug: b.slug })),
    ];

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    res.status(500).json({ message: 'Server error fetching suggestions.' });
  }
};

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOne({ slug })
      .populate('brand', 'name slug logo description contactEmail')
      .populate('category', 'name slug baseCommission');

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Server error fetching product.' });
  }
};

// @desc    Get seller own products
// @route   GET /api/products/seller/my-products
// @access  Private (Role: BRAND)
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

// @desc    Create a new product (Brand partner)
// @route   POST /api/products/seller/create
// @access  Private (Role: BRAND)
export const createProduct = async (req, res) => {
  const { name, modelNumber, SKU, category, description, mrp, sellingPrice, gstRate, images, stock, specifications } = req.body;

  try {
    // Generate unique slug
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
        reorderThreshold: stock?.reorderThreshold || 5,
      },
      specifications: specifications || {},
      status: 'Pending Approval', // Awaiting Admin Approval
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

// @desc    Update an existing product
// @route   PUT /api/products/seller/update/:id
// @access  Private (Role: BRAND)
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
      // Re-generate slug if name changed
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

    // Resubmitted updates send it back to review
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

// @desc    Delete a product
// @route   DELETE /api/products/seller/delete/:id
// @access  Private (Role: BRAND)
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
