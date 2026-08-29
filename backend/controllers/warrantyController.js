import Warranty from '../models/Warranty.js';

// @desc    Get current user warranties
// @route   GET /api/warranties
// @access  Private
export const getUserWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({ customer: req.user._id })
      .populate('product', 'name SKU modelNumber images')
      .populate('brand', 'name slug logo')
      .populate('orderId', 'orderId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, warranties });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warranty records.' });
  }
};

// @desc    Log a warranty claim request
// @route   POST /api/warranties/:id/claim
// @access  Private
export const claimWarranty = async (req, res) => {
  const { id } = req.params;

  try {
    const warranty = await Warranty.findOne({ _id: id, customer: req.user._id });

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty record not found.' });
    }

    if (warranty.status === 'Claimed') {
      return res.status(400).json({ message: 'Warranty claim already filed and under review.' });
    }

    if (new Date() > warranty.endDate) {
      warranty.status = 'Expired';
      await warranty.save();
      return res.status(400).json({ message: 'This product warranty has expired.' });
    }

    warranty.status = 'Claimed';
    await warranty.save();

    res.status(200).json({
      success: true,
      message: 'Warranty claim request submitted successfully. Support team will contact you.',
      warranty,
    });
  } catch (error) {
    console.error('Error claiming warranty:', error);
    res.status(500).json({ message: 'Server error processing warranty claim.' });
  }
};
