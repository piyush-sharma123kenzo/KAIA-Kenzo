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
import storageService from '../services/storage.service.js';
import { formatUserResponse } from '../utils/jwt.utils.js';
import {
  getWishlist as getWishlistHandler,
  addToWishlist as addToWishlistHandler,
  removeFromWishlist as removeFromWishlistHandler,
} from './wishlist.controller.js';
import { submitCustomerReview, removeReview } from '../services/review/review.service.js';

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
      wishlistDoc,
      unreadNotificationsCount,
      recentOrders,
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      Order.countDocuments({ customer: userId }),
      Order.countDocuments({ customer: userId, orderStatus: { $in: ['placed', 'confirmed', 'processing', 'partially_shipped', 'shipped'] } }),
      Order.countDocuments({ customer: userId, orderStatus: 'delivered' }),
      ReturnRequest.countDocuments({ customerId: userId }),
      Wishlist.findOne({ user: userId }),
      Notification.countDocuments({ user: userId, read: false }),
      Order.find({ customer: userId })
        .populate({
          path: 'childOrders',
          populate: { path: 'seller', select: 'name slug logo' },
        })
        .sort({ createdAt: -1 })
        .limit(3),
    ]);

    const wishlistCount = Array.isArray(wishlistDoc?.products) ? wishlistDoc.products.length : 0;

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

    if (file) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const oldPublicId = user.profileImage?.publicId || '';
      const oldUrl = user.profileImage?.url || user.avatar || '';

      // 1. Upload directly to Cloudinary
      const uploadRes = await storageService.upload(file, user._id.toString(), {
        folder: 'kaia/profiles',
        resourceType: 'image',
      });

      // 2. Update user profile in database
      user.profileImage = {
        url: uploadRes.url,
        publicId: uploadRes.publicId,
        updatedAt: uploadRes.updatedAt || new Date(),
      };
      user.avatar = uploadRes.url;
      await user.save();

      // 3. Safe cleanup of old image after successful DB write
      if (oldPublicId || oldUrl) {
        try {
          await storageService.delete(oldPublicId, oldUrl);
        } catch (e) {
          // Ignore cleanup warning
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Profile avatar updated successfully.',
        avatar: user.avatar,
        user: formatUserResponse(user),
      });
    }

    if (!req.body.avatarUrl && !req.body.avatar) {
      return res.status(400).json({ success: false, message: 'No avatar image file or URL provided.' });
    }

    const avatarUrl = req.body.avatarUrl || req.body.avatar;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.avatar = avatarUrl;
    if (!user.profileImage) user.profileImage = {};
    user.profileImage.url = avatarUrl;
    user.profileImage.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile avatar updated successfully.',
      avatar: user.avatar,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload profile avatar.',
    });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const publicId = user.profileImage?.publicId || '';
    const url = user.profileImage?.url || user.avatar || '';

    if (publicId || url) {
      await storageService.delete(publicId, url);
    }

    user.profileImage = {
      url: '',
      publicId: '',
      updatedAt: new Date(),
    };
    user.avatar = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile avatar removed successfully.',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove profile avatar.',
    });
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
  return getWishlistHandler(req, res);
};

export const addToWishlist = async (req, res) => {
  return addToWishlistHandler(req, res);
};

export const removeFromWishlist = async (req, res) => {
  return removeFromWishlistHandler(req, res);
};

// ==========================================
// 5. CUSTOMER REVIEWS & VERIFIED PURCHASES
// ==========================================

export const getCustomerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate({
        path: 'product',
        select: 'name SKU images sellingPrice mrp slug',
        populate: { path: 'brand', select: 'name slug logo' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reviews.' });
  }
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Product ID, rating (1-5), and review comment are required.' });
    }

    const result = await submitCustomerReview({
      userId: req.user._id,
      userName: req.user.name,
      productId,
      rating,
      title,
      comment,
    });

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Verified review submitted successfully.' : 'Review updated successfully.',
      review: result.review,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Error saving review.' });
  }
};

export const deleteCustomerReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeReview(id, req.user._id, false);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Error deleting review.' });
  }
};

// ==========================================
// 6. NOTIFICATIONS CENTER
// ==========================================

export const getCustomerNotifications = async (req, res) => {
  try {
    const { unreadOnly, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.read = false;

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Notification.countDocuments({ user: req.user._id, read: false }),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.status(200).json({ success: true, message: 'Notification marked as read.', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notifications.' });
  }
};

export const deleteCustomerNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting notification.' });
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
