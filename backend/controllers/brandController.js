import Brand from '../models/Brand.js';
import User from '../models/User.js';

// @desc    Register a brand profile
// @route   POST /api/brands/register
// @access  Private (Role: BRAND)
export const registerBrand = async (req, res) => {
  const { name, description, contactEmail, contactPhone, businessDetails, bankDetails } = req.body;

  try {
    const existingBrand = await Brand.findOne({ owner: req.user._id });
    if (existingBrand) {
      return res.status(400).json({ message: 'You have already registered a brand profile.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slugExists = await Brand.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ message: 'A brand with a similar name already exists.' });
    }

    const brand = await Brand.create({
      owner: req.user._id,
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      businessDetails,
      bankDetails,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Brand profile registered successfully. Awaiting admin approval.',
      brand,
    });
  } catch (error) {
    console.error('Brand registration error:', error);
    res.status(500).json({ message: 'Server error during brand registration.' });
  }
};

// @desc    Get all approved brands
// @route   GET /api/brands
// @access  Public
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ status: 'Approved' });
    res.status(200).json({ success: true, brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Server error fetching brands.' });
  }
};

// @desc    Get brand details by slug
// @route   GET /api/brands/:slug
// @access  Public
export const getBrandBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const brand = await Brand.findOne({ slug, status: 'Approved' });
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.status(200).json({ success: true, brand });
  } catch (error) {
    console.error('Error fetching brand details:', error);
    res.status(500).json({ message: 'Server error fetching brand details.' });
  }
};

// @desc    Get current user's brand profile
// @route   GET /api/brands/my-brand
// @access  Private (Role: BRAND)
export const getMyBrand = async (req, res) => {
  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found for this user.' });
    }
    res.status(200).json({ success: true, brand });
  } catch (error) {
    console.error('Error fetching partner brand profile:', error);
    res.status(500).json({ message: 'Server error fetching brand profile.' });
  }
};

// @desc    Update current brand profile details
// @route   PUT /api/brands/my-brand
// @access  Private (Role: BRAND)
export const updateMyBrand = async (req, res) => {
  const { description, contactEmail, contactPhone, logo, bankDetails } = req.body;

  try {
    const brand = await Brand.findOne({ owner: req.user._id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found.' });
    }

    if (description) brand.description = description;
    if (contactEmail) brand.contactEmail = contactEmail;
    if (contactPhone) brand.contactPhone = contactPhone;
    if (logo) brand.logo = logo;
    if (bankDetails) brand.bankDetails = bankDetails;

    // Any edits send it back to 'Under Review' status for safety?
    // Let's keep it approved if it was approved, or send to Under Review to let Admin verify bank edits.
    if (brand.status === 'Approved') {
      brand.status = 'Approved'; // Let's keep it approved for smoother demo
    }

    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand details updated successfully.',
      brand,
    });
  } catch (error) {
    console.error('Update brand profile error:', error);
    res.status(500).json({ message: 'Server error updating brand details.' });
  }
};
