import DirectSupplyEnquiry from '../models/DirectSupplyEnquiry.js';

// @desc    Submit direct brand supply bulk procurement enquiry
// @route   POST /api/enquiries/direct-supply
// @access  Public
export const submitDirectSupplyEnquiry = async (req, res) => {
  try {
    const { name, companyName, email, phone, productRequirement, quantity, targetTimeline, message } = req.body;

    if (!name || !companyName || !email || !phone || !productRequirement || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Name, Company Name, Email, Phone, Product Requirement, and Quantity.',
      });
    }

    const enquiry = await DirectSupplyEnquiry.create({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      productRequirement: productRequirement.trim(),
      quantity: Number(quantity),
      targetTimeline: targetTimeline || 'Within 30 Days',
      message: message ? message.trim() : '',
      status: 'New',
    });

    res.status(201).json({
      success: true,
      message: 'Your Direct Brand Supply inquiry has been registered. An enterprise account manager will contact you within 24 hours.',
      enquiryId: enquiry._id,
    });
  } catch (error) {
    console.error('[Direct Supply Enquiry Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit direct supply inquiry.' });
  }
};

// @desc    Get all direct supply inquiries (Admin)
// @route   GET /api/enquiries/admin
// @access  Private/Admin
export const getAdminEnquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { productRequirement: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [enquiries, total] = await Promise.all([
      DirectSupplyEnquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      DirectSupplyEnquiry.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      enquiries,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('[Admin Enquiries Error]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving direct supply inquiries.' });
  }
};

// @desc    Update enquiry status / notes (Admin)
// @route   PUT /api/enquiries/admin/:id
// @access  Private/Admin
export const updateAdminEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const enquiry = await DirectSupplyEnquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    if (status) enquiry.status = status;
    if (adminNotes !== undefined) enquiry.adminNotes = adminNotes;

    await enquiry.save();

    res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully.',
      enquiry,
    });
  } catch (error) {
    console.error('[Update Enquiry Error]:', error);
    res.status(500).json({ success: false, message: 'Server error updating enquiry.' });
  }
};
