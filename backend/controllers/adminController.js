import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

// Helper to create admin audit logs
const logAdminAction = async (adminId, action, entity, entityId, changes, req) => {
  try {
    await AuditLog.create({
      user: adminId,
      action,
      entity,
      entityId,
      changes,
      metadata: {
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Role: ADMIN)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
};

// @desc    Toggle user status (Active / Suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Role: ADMIN)
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const prevStatus = user.status;
    user.status = status;
    await user.save();

    await logAdminAction(req.user._id, `Toggled status from ${prevStatus} to ${status}`, 'User', user._id, { prevStatus, status }, req);

    res.status(200).json({ success: true, message: `User account is now ${status}.`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user status.' });
  }
};

// @desc    Get all brand registrations
// @route   GET /api/admin/brands
// @access  Private (Role: ADMIN)
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).populate('owner', 'name email phone');
    res.status(200).json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands.' });
  }
};

// @desc    Approve or Reject a brand partner
// @route   PUT /api/admin/brands/:id/approve
// @access  Private (Role: ADMIN)
export const verifyBrand = async (req, res) => {
  const { id } = req.params;
  const { status, commissionOverride, rejectionReason } = req.body;

  try {
    const brand = await Brand.findById(id).populate('owner');
    if (!brand) return res.status(404).json({ message: 'Brand registration not found.' });

    const prevStatus = brand.status;
    brand.status = status;
    if (commissionOverride !== undefined) brand.commissionOverride = commissionOverride;
    if (rejectionReason !== undefined) brand.rejectionReason = rejectionReason;

    await brand.save();

    // Log admin action
    await logAdminAction(req.user._id, `Set status to ${status}`, 'Brand', brand._id, { prevStatus, status, commissionOverride }, req);

    // Update user role if approved
    if (status === 'Approved' && brand.owner.role === 'CUSTOMER') {
      const user = await User.findById(brand.owner._id);
      user.role = 'BRAND';
      await user.save();
    }

    // Notify brand owner
    await Notification.create({
      user: brand.owner._id,
      title: `Brand Application Status: ${status}`,
      message: status === 'Approved'
        ? `Congratulations! Your brand partner account for ${brand.name} has been approved.`
        : `Your application was set to '${status}'. Reason: ${rejectionReason || 'Under documentation review.'}`,
      type: 'Approval',
    });

    res.status(200).json({ success: true, message: `Brand status updated to ${status}.`, brand });
  } catch (error) {
    console.error('Error verifying brand:', error);
    res.status(500).json({ message: 'Error verifying brand registration.' });
  }
};

// @desc    Get pending products list
// @route   GET /api/admin/products/pending
// @access  Private (Role: ADMIN)
export const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'Pending Approval' })
      .populate('brand', 'name slug')
      .populate('category', 'name slug');
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products pending approval.' });
  }
};

// @desc    Approve/Reject a product listing
// @route   PUT /api/admin/products/:id/verify
// @access  Private (Role: ADMIN)
export const verifyProduct = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Approved or Rejected

  try {
    const product = await Product.findById(id).populate({ path: 'brand', populate: { path: 'owner' } });
    if (!product) return res.status(404).json({ message: 'Product listing not found.' });

    const prevStatus = product.status;
    product.status = status;
    await product.save();

    await logAdminAction(req.user._id, `Verified listing status: ${status}`, 'Product', product._id, { prevStatus, status }, req);

    // Notify brand owner
    await Notification.create({
      user: product.brand.owner._id,
      title: `Product Listing: ${status}`,
      message: `Your product '${product.name}' listing status has been set to '${status}'.`,
      type: 'Approval',
    });

    res.status(200).json({ success: true, message: `Product status updated to ${status}.`, product });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying product listing.' });
  }
};

// @desc    Add a new product category
// @route   POST /api/admin/categories
// @access  Private (Role: ADMIN)
export const createCategory = async (req, res) => {
  const { name, description, baseCommission, parentCategory } = req.body;

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Category already exists.' });

    const category = await Category.create({
      name,
      slug,
      description,
      baseCommission: baseCommission || 5.0,
      parentCategory: parentCategory || null,
    });

    await logAdminAction(req.user._id, `Created Category: ${name}`, 'Category', category._id, { name, slug }, req);

    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category.' });
  }
};

// @desc    Get platform commission payouts ledger
// @route   GET /api/admin/commissions
// @access  Private (Role: ADMIN)
export const getCommissionsLedger = async (req, res) => {
  try {
    const ledger = await Transaction.find({})
      .populate('orderId', 'orderId customer createdAt paymentDetails')
      .populate('childOrderId', 'orderId items fulfillmentStatus subtotal gstAmount finalAmount')
      .populate('seller', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, ledger });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching commission transaction ledger.' });
  }
};

// @desc    Get administrative audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Role: ADMIN)
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching administrative audit logs.' });
  }
};
