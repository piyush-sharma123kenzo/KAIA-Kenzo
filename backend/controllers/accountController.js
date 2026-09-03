import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Wishlist from '../models/Wishlist.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';
import Invoice from '../models/Invoice.js';
import Warranty from '../models/Warranty.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// 1. ACCOUNT OVERVIEW
// ==========================================

export const getAccountOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      userDoc,
      totalOrders,
      activeOrders,
      deliveredOrders,
      totalReturns,
      wishlistCount,
      unreadNotificationsCount,
      recentOrders,
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      Order.countDocuments({ customer: userId }),
      Order.countDocuments({ customer: userId, orderStatus: { $in: ['placed', 'confirmed', 'processing', 'partially_shipped', 'shipped'] } }),
      Order.countDocuments({ customer: userId, orderStatus: 'delivered' }),
      ReturnRequest.countDocuments({ customerId: userId }),
      Wishlist.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, read: false }),
      Order.find({ customer: userId })
        .populate({
          path: 'childOrders',
          populate: { path: 'seller', select: 'name slug logo' },
        })
        .sort({ createdAt: -1 })
        .limit(3),
    ]);

    res.status(200).json({
      success: true,
      user: userDoc,
      stats: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalReturns,
        wishlistCount,
        unreadNotificationsCount,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching account overview:', error);
    res.status(500).json({ message: 'Error retrieving account details.' });
  }
};

// ==========================================
// 2. PROFILE & SECURITY
// ==========================================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, firstName, lastName, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name.trim();
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    // Auto sync full name if first and last name provided
    if (firstName && lastName) user.name = `${firstName.trim()} ${lastName.trim()}`;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile.' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

    if (!file && !req.body.avatarUrl && !req.body.avatar) {
      return res.status(400).json({ success: false, message: 'No avatar image file or URL provided.' });
    }

    let avatarUrl = '';
    if (file) {
      const normalized = file.path.replace(/\\/g, '/');
      avatarUrl = normalized.startsWith('/') ? normalized : `/${normalized}`;
    } else {
      avatarUrl = req.body.avatarUrl || req.body.avatar;
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Clean up old local avatar file if it exists to prevent disk clutter
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) { console.warn('Could not delete old avatar:', e.message); }
      }
    }

    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile avatar updated successfully.',
      avatar: user.avatar,
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload profile avatar.' });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Delete existing file from disk if local
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) {}
      }
    }

    user.avatar = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile avatar removed successfully.',
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: '',
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove avatar.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Security Alert: Password Changed',
      message: 'Your account password was updated successfully. If this was not you, please contact security immediately.',
      type: 'Alert',
    });

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password.' });
  }
};

// ==========================================
// 3. ADDRESS BOOK CRUD
// ==========================================

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.status(200).json({ success: true, addresses: user.addresses || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses.' });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { 
      name, fullName, phone, addressLine1, addressLine2, landmark, 
      city, state, postalCode, country, label, type, isDefault,
      latitude, longitude 
    } = req.body;

    const recipientName = (fullName || name || '').trim();
    const streetAddress = (addressLine1 || req.body.street || '').trim();

    if (!recipientName || !phone || !streetAddress || !city || !state || !postalCode) {
      return res.status(400).json({ message: 'Please fill in all mandatory address fields (Name, Phone, Address Line 1, City, State, PIN code).' });
    }

    const user = await User.findById(req.user._id);
    user.addresses = user.addresses || [];

    // If marked as default or first address, unset previous defaults
    const shouldBeDefault = isDefault || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    const addressType = type || label || 'Home';

    user.addresses.push({
      fullName: recipientName,
      name: recipientName,
      phone: phone.trim(),
      addressLine1: streetAddress,
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country || 'India',
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      type: addressType,
      label: addressType,
      isDefault: shouldBeDefault,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Error adding address.' });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(id);

    if (!addr) return res.status(404).json({ message: 'Address not found.' });

    const fields = [
      'name', 'fullName', 'phone', 'addressLine1', 'addressLine2', 'landmark',
      'city', 'state', 'postalCode', 'country', 'label', 'type'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined && typeof req.body[f] === 'string') {
        addr[f] = req.body[f].trim();
      }
    });

    if (req.body.latitude !== undefined) addr.latitude = req.body.latitude ? Number(req.body.latitude) : null;
    if (req.body.longitude !== undefined) addr.longitude = req.body.longitude ? Number(req.body.longitude) : null;

    if (addr.fullName && !addr.name) addr.name = addr.fullName;
    if (addr.name && !addr.fullName) addr.fullName = addr.name;
    if (addr.type && !addr.label) addr.label = addr.type;
    if (addr.label && !addr.type) addr.type = addr.label;

    if (req.body.isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();

    res.status(200).json({ success: true, message: 'Address updated successfully.', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Error updating address.' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    
    user.addresses.pull({ _id: id });
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({ success: true, message: 'Address deleted.', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address.' });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === id;
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Default address updated.', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Error setting default address.' });
  }
};

// ==========================================
// 4. WISHLIST MANAGEMENT
// ==========================================

export const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'product',
        populate: { path: 'brand', select: 'name slug logo' },
      })
      .sort({ createdAt: -1 });

    const validItems = items.filter((item) => item.product !== null);

    res.status(200).json({
      success: true,
      wishlist: validItems,
      count: validItems.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist.' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product is currently unavailable.' });
    }

    const existing = await Wishlist.findOne({ user: req.user._id, product: productId });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Product is already in your wishlist.', item: existing });
    }

    const item = await Wishlist.create({
      user: req.user._id,
      product: productId,
    });

    res.status(201).json({ success: true, message: 'Added to wishlist.', item });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to wishlist.' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });
    res.status(200).json({ success: true, message: 'Removed from wishlist.' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from wishlist.' });
  }
};

// ==========================================
// 5. CUSTOMER REVIEWS & VERIFIED PURCHASES
// ==========================================

export const getCustomerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate({
        path: 'product',
        select: 'name SKU images sellingPrice',
        populate: { path: 'brand', select: 'name slug logo' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Product ID, rating (1-5), and review comment are required.' });
    }

    // Verified purchase check
    const prodIdStr = productId.toString();
    const orders = await Order.find({ customer: req.user._id, paymentStatus: 'Paid' }).populate('childOrders');
    let hasPurchased = false;
    let purchaseOrderId = null;

    for (const order of orders) {
      if (order.items && order.items.some((it) => it.product?.toString() === prodIdStr)) {
        hasPurchased = true;
        purchaseOrderId = order._id;
        break;
      }
      for (const childOrder of (order.childOrders || [])) {
        const match = (childOrder.items || []).some((it) => it.product?.toString() === prodIdStr);
        if (match) {
          hasPurchased = true;
          purchaseOrderId = order._id;
          break;
        }
      }
      if (hasPurchased) break;
    }

    if (!hasPurchased) {
      return res.status(403).json({ message: 'Only verified purchasers of this product can submit a review.' });
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, product: productId },
      {
        user: req.user._id,
        product: productId,
        name: req.user.name,
        rating: Number(rating),
        title: title || '',
        comment: comment.trim(),
        isVerifiedPurchase: true,
        orderId: purchaseOrderId,
        isHidden: false,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Review saved successfully.',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving review.' });
  }
};

// ==========================================
// 6. NOTIFICATIONS CENTER
// ==========================================

export const getCustomerNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.read = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications.' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true });
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification.' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications.' });
  }
};

// ==========================================
// 7. INVOICE & WARRANTY CENTERS
// ==========================================

export const getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.user._id })
      .populate('brandId', 'name slug logo')
      .populate('orderId', 'orderId createdAt paymentStatus orderStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices.' });
  }
};

export const getCustomerWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({ customer: req.user._id })
      .populate('product', 'name SKU modelNumber images')
      .populate('brand', 'name slug logo')
      .populate('orderId', 'orderId')
      .sort({ createdAt: -1 });

    // Format with masked serial/IMEI (e.g. XXXXXX1234)
    const masked = warranties.map((w) => {
      const sn = w.serialNumber || '';
      const maskedSn = sn.length > 4 ? `${'X'.repeat(sn.length - 4)}${sn.slice(-4)}` : sn;
      return {
        ...w.toObject(),
        maskedSerialNumber: maskedSn,
      };
    });

    res.status(200).json({ success: true, warranties: masked });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warranty records.' });
  }
};
