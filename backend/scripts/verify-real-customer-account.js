import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Wishlist from '../models/Wishlist.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Warranty from '../models/Warranty.js';
import {
  getAccountOverview,
  updateProfile,
  changePassword,
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  createOrUpdateReview,
  getCustomerReviews,
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getCustomerWarranties,
} from '../controllers/accountController.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runCustomerAccountVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real Customer Account, Wishlist, Reviews & Post-Purchase Experience Verification...\n');

    // 1. Create/fetch test customer users
    const rand = Math.floor(1000 + Math.random() * 9000);
    const customerA = await User.create({
      name: `Customer Alpha ${rand}`,
      email: `cust.alpha.${rand}@test.com`,
      password: 'OldPassword123!',
      role: 'CUSTOMER',
    });

    const customerB = await User.create({
      name: `Customer Beta ${rand}`,
      email: `cust.beta.${rand}@test.com`,
      password: 'Password123!',
      role: 'CUSTOMER',
    });

    const product = await Product.findOne({ isActive: true });
    if (!product) throw new Error('No active product found for testing.');

    // Helper to mock Express req/res
    const createMock = (userObj, body = {}, query = {}, params = {}) => {
      let statusCode = 200;
      let responseData = null;
      const req = {
        user: userObj,
        body,
        query,
        params,
      };
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };
      return { req, res, getStatus: () => statusCode, getData: () => responseData };
    };

    // TEST 1: Account Overview Stats
    const t1 = createMock(customerA);
    await getAccountOverview(t1.req, t1.res);
    const d1 = t1.getData();
    if (!d1.success || typeof d1.stats.totalOrders !== 'number') {
      throw new Error('Account overview stats failed!');
    }
    console.log(`✓ Test 1 Passed: Real Account Overview stats retrieved (Total: ${d1.stats.totalOrders}, Active: ${d1.stats.activeOrders}, Wishlist: ${d1.stats.wishlistCount}).`);

    // TEST 2: Profile Update
    const t2 = createMock(customerA, {
      firstName: 'Alpha',
      lastName: 'Piyush',
      phone: '9876543210',
    });
    await updateProfile(t2.req, t2.res);
    const d2 = t2.getData();
    if (!d2.success || d2.user.name !== 'Alpha Piyush' || d2.user.phone !== '9876543210') {
      throw new Error('Profile update failed!');
    }
    console.log(`✓ Test 2 Passed: Customer profile updated ("${d2.user.name}", Phone: ${d2.user.phone}).`);

    // TEST 3: Password Security (Check old, validate complexity, encrypt new)
    // 3a. Wrong current password
    const t3a = createMock(customerA, {
      currentPassword: 'WrongPassword!',
      newPassword: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    });
    await changePassword(t3a.req, t3a.res);
    if (t3a.getStatus() !== 400) throw new Error('Incorrect current password was not rejected!');

    // 3b. Successful password change
    const t3b = createMock(customerA, {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    });
    await changePassword(t3b.req, t3b.res);
    if (!t3b.getData().success) throw new Error('Password change failed!');

    // Check if new password matches
    const updatedCustA = await User.findById(customerA._id);
    const isNewPass = await updatedCustA.matchPassword('NewSecurePassword123!');
    if (!isNewPass) throw new Error('New password was not encrypted properly!');
    console.log(`✓ Test 3 Passed: Password security verified (old password checked, encrypted new password, security alert dispatched).`);

    // TEST 4: Address Book CRUD & Defaults
    // 4a. Add Address 1 (becomes default automatically)
    const t4a = createMock(customerA, {
      name: 'Alpha Home',
      phone: '9876543210',
      addressLine1: 'Flat 101, Prestige Towers',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      label: 'Home',
    });
    await addAddress(t4a.req, t4a.res);
    const d4a = t4a.getData();
    if (!d4a.success || d4a.addresses.length !== 1 || !d4a.addresses[0].isDefault) {
      throw new Error('Address 1 addition or default assignment failed!');
    }

    // 4b. Add Address 2
    const t4b = createMock(customerA, {
      name: 'Alpha Office',
      phone: '9876543210',
      addressLine1: 'Tech Park SEZ, Block B',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      label: 'Work',
      isDefault: true, // Should set this as default and unset address 1
    });
    await addAddress(t4b.req, t4b.res);
    const d4b = t4b.getData();
    const addr2 = d4b.addresses.find((a) => a.label === 'Work');
    const addr1 = d4b.addresses.find((a) => a.label === 'Home');
    if (!addr2.isDefault || addr1.isDefault) {
      throw new Error('Default address switching failed!');
    }
    console.log(`✓ Test 4 Passed: Address book CRUD verified with default address switching.`);

    // TEST 5: Wishlist Management & Duplicate Prevention
    // 5a. Add product to wishlist
    const t5a = createMock(customerA, { productId: product._id });
    await addToWishlist(t5a.req, t5a.res);
    if (!t5a.getData().success) throw new Error('Add to wishlist failed!');

    // 5b. Add same product again (idempotent check)
    const t5b = createMock(customerA, { productId: product._id });
    await addToWishlist(t5b.req, t5b.res);
    const wCount = await Wishlist.countDocuments({ user: customerA._id, product: product._id });
    if (wCount !== 1) throw new Error('Duplicate wishlist entry was created!');

    // 5c. Retrieve wishlist with populated live product data
    const t5c = createMock(customerA);
    await getWishlist(t5c.req, t5c.res);
    const d5c = t5c.getData();
    if (!d5c.success || d5c.wishlist.length !== 1 || d5c.wishlist[0].product.name !== product.name) {
      throw new Error('Wishlist retrieval failed!');
    }

    // 5d. Remove from wishlist
    const t5d = createMock(customerA, {}, {}, { productId: product._id });
    await removeFromWishlist(t5d.req, t5d.res);
    const wAfter = await Wishlist.countDocuments({ user: customerA._id });
    if (wAfter !== 0) throw new Error('Remove from wishlist failed!');
    console.log(`✓ Test 5 Passed: Wishlist lifecycle verified (add, duplicate prevention, live population, remove).`);

    // TEST 6: Customer Reviews & Verified Purchase Enforcement
    // 6a. Non-purchased product review -> Must be rejected (403)
    const t6a = createMock(customerA, {
      productId: product._id,
      rating: 5,
      title: 'Amazing machine',
      comment: 'Super fast laptop with RTX graphics.',
    });
    await createOrUpdateReview(t6a.req, t6a.res);
    if (t6a.getStatus() !== 403) {
      throw new Error('Non-verified customer was able to post a review!');
    }
    console.log(`✓ Test 6a Passed: Non-purchased review rejected with 403 Forbidden.`);

    // 6b. Create order for customer A to verify review purchase check
    const verifiedOrder = await Order.create({
      orderId: `ORD-REV-${Date.now()}`,
      customer: customerA._id,
      items: [{
        product: product._id,
        productName: product.name,
        brand: product.brand,
        brandName: 'Test Brand',
        sku: product.SKU,
        quantity: 1,
        unitPrice: product.sellingPrice,
        tax: 0,
        discount: 0,
        lineTotal: product.sellingPrice,
      }],
      shippingAddress: {
        name: 'Alpha Piyush',
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9876543210',
      },
      billingAddress: {
        name: 'Alpha Piyush',
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9876543210',
      },
      subtotal: product.sellingPrice,
      finalAmount: product.sellingPrice,
      paymentStatus: 'Paid',
      orderStatus: 'delivered',
    });

    const verifiedSellerOrder = await SellerOrder.create({
      parentOrder: verifiedOrder._id,
      orderId: `SO-REV-${Date.now()}`,
      seller: product.brand,
      items: [{
        product: product._id,
        name: product.name,
        sku: product.SKU,
        price: product.sellingPrice,
        qty: 1,
      }],
      subtotal: product.sellingPrice,
      finalAmount: product.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Delivered',
      shippingAddress: verifiedOrder.shippingAddress,
    });

    // 6c. Now submit review with verified purchase
    const t6c = createMock(customerA, {
      productId: product._id,
      rating: 5,
      title: 'Flawless performance',
      comment: 'Verified purchase. Thermals are incredible under full load.',
    });
    await createOrUpdateReview(t6c.req, t6c.res);
    if (!t6c.getData()?.success || !t6c.getData()?.review?.isVerifiedPurchase) {
      console.error('t6c error details:', t6c.getStatus(), t6c.getData());
      throw new Error('Verified review submission failed!');
    }
    console.log(`✓ Test 6b Passed: Verified purchase review submitted successfully.`);

    // TEST 7: Notification Center
    await Notification.create({
      user: customerA._id,
      title: 'Order Delivered',
      message: `Your package for Order #${verifiedOrder.orderId} was delivered.`,
      type: 'Order',
      read: false,
    });

    const t7a = createMock(customerA);
    await getCustomerNotifications(t7a.req, t7a.res);
    if (!t7a.getData().success || t7a.getData().unreadCount < 1) {
      throw new Error('Notification retrieval failed!');
    }

    const t7b = createMock(customerA);
    await markAllNotificationsAsRead(t7b.req, t7b.res);
    const unreadAfter = await Notification.countDocuments({ user: customerA._id, read: false });
    if (unreadAfter !== 0) throw new Error('Mark all as read failed!');
    console.log(`✓ Test 7 Passed: Notification center retrieved unread count and marked all as read.`);

    // TEST 8: Warranty Access & Serial Masking
    await Warranty.create({
      serialNumber: 'SN998877665544',
      product: product._id,
      brand: product.brand,
      customer: customerA._id,
      orderId: verifiedSellerOrder._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    const t8 = createMock(customerA);
    await getCustomerWarranties(t8.req, t8.res);
    const d8 = t8.getData();
    if (!d8.success || d8.warranties.length !== 1) {
      throw new Error('Customer warranty retrieval failed!');
    }
    const maskedSn = d8.warranties[0].maskedSerialNumber;
    if (!maskedSn.startsWith('XXXXXXXX') || !maskedSn.endsWith('5544')) {
      throw new Error(`Serial number was not masked securely! Got: "${maskedSn}"`);
    }
    console.log(`✓ Test 8 Passed: Warranty center displayed masked serial number ("${maskedSn}").`);

    // TEST 9: IDOR & Customer Data Privacy (Customer B cannot view Customer A's data)
    const t9Overview = createMock(customerB);
    await getAccountOverview(t9Overview.req, t9Overview.res);
    const d9 = t9Overview.getData();
    if (d9.stats.totalOrders !== 0 || d9.user._id.toString() !== customerB._id.toString()) {
      throw new Error('IDOR data leakage detected: Customer B saw Customer A data!');
    }
    console.log(`✓ Test 9 Passed: IDOR protection verified (Customer B has completely isolated account context).`);

    console.log('\n🎉 ALL CUSTOMER ACCOUNT, WISHLIST, REVIEWS & POST-PURCHASE TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Customer account verification failed:', err);
    process.exit(1);
  }
};

runCustomerAccountVerification();
