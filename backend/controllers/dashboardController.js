import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Transaction from '../models/Transaction.js';

// @desc    Get dashboard metrics & chart data for Brand Seller
// @route   GET /api/dashboard/seller
// @access  Private (Role: BRAND)
export const getBrandDashboardStats = async (req, res) => {
  try {
    const brandId = req.brand._id;

    // Find all paid child orders for this seller
    const sellerOrders = await SellerOrder.find({ seller: brandId }).populate('parentOrder');
    const activeOrders = sellerOrders.filter(o => o.parentOrder && o.parentOrder.paymentStatus === 'Paid');

    // Metrics
    const totalOrdersCount = activeOrders.length;
    const pendingOrdersCount = activeOrders.filter(o => o.fulfillmentStatus === 'Processing' || o.fulfillmentStatus === 'Packed').length;
    
    let totalRevenue = 0;
    let totalCommissions = 0;
    activeOrders.forEach(o => {
      if (o.fulfillmentStatus !== 'Cancelled') {
        totalRevenue += o.finalAmount;
        totalCommissions += o.commissionAmount;
      }
    });

    const netPayout = totalRevenue - totalCommissions;

    // Low stock items
    const lowStockCount = await Product.countDocuments({
      brand: brandId,
      $expr: { $lte: ['$stock.quantity', '$stock.reorderThreshold'] }
    });

    // Product performance
    const products = await Product.find({ brand: brandId });
    const productStats = products.map(p => ({
      name: p.name,
      SKU: p.SKU,
      price: p.sellingPrice,
      qty: p.stock.quantity,
      status: p.status,
    }));

    // Monthly Sales aggregation
    const monthlySales = {};
    activeOrders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlySales[month]) {
        monthlySales[month] = { month, sales: 0, orders: 0 };
      }
      monthlySales[month].sales += order.finalAmount;
      monthlySales[month].orders += 1;
    });

    const chartData = Object.values(monthlySales);

    res.status(200).json({
      success: true,
      metrics: {
        totalRevenue,
        totalCommissions,
        netPayout,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        lowStockItems: lowStockCount,
      },
      chartData,
      productStats,
    });
  } catch (error) {
    console.error('Error fetching brand stats:', error);
    res.status(500).json({ message: 'Error fetching brand analytics data.' });
  }
};

// @desc    Get dashboard metrics & chart data for Admin Control Panel
// @route   GET /api/dashboard/admin
// @access  Private (Role: ADMIN)
export const getAdminDashboardStats = async (req, res) => {
  try {
    // Platform totals
    const totalUsers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalBrands = await Brand.countDocuments({ status: 'Approved' });
    const totalProducts = await Product.countDocuments({ status: 'Approved' });
    
    // Approvals pending
    const pendingBrands = await Brand.countDocuments({ status: 'Pending' });
    const pendingProducts = await Product.countDocuments({ status: 'Pending Approval' });

    // Financial calculations
    const paidOrders = await Order.find({ paymentStatus: 'Paid' });
    const gmv = paidOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const ledgers = await Transaction.find({});
    const commissionRevenue = ledgers.reduce((sum, l) => sum + l.commissionAmount, 0);
    const sellerPayouts = ledgers.reduce((sum, l) => sum + l.netSellerPayout, 0);

    // Group sales data by month
    const monthlyAdminSales = {};
    paidOrders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyAdminSales[month]) {
        monthlyAdminSales[month] = { month, gmv: 0, revenue: 0, orders: 0 };
      }
      monthlyAdminSales[month].gmv += order.finalAmount;
      monthlyAdminSales[month].orders += 1;
    });

    // Add matching commissions from ledger into chartData
    ledgers.forEach(ledger => {
      const month = new Date(ledger.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthlyAdminSales[month]) {
        monthlyAdminSales[month].revenue += ledger.commissionAmount;
      }
    });

    const chartData = Object.values(monthlyAdminSales);

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalBrands,
        totalProducts,
        pendingBrands,
        pendingProducts,
        gmv,
        commissionRevenue,
        sellerPayouts,
      },
      chartData,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching platform dashboard stats.' });
  }
};
