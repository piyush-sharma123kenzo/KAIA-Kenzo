import Coupon from '../models/Coupon.js';

// @desc    Verify a coupon code
// @route   POST /api/coupons/verify
// @access  Private
export const verifyCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Coupon code is required.' });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code.' });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: 'This coupon has expired.' });
    }

    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `This coupon requires a minimum purchase of ₹${coupon.minOrderAmount.toLocaleString()}.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon code applied successfully.',
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error) {
    console.error('Error verifying coupon:', error);
    res.status(500).json({ message: 'Server error verifying coupon.' });
  }
};

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Public
export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons.' });
  }
};
