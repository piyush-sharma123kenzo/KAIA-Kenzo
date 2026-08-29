import Product from '../models/Product.js';
import SerialNumber from '../models/SerialNumber.js';

// @desc    Get inventory status (stock counts)
// @route   GET /api/inventory
// @access  Private (Role: BRAND)
export const getMyInventory = async (req, res) => {
  try {
    const products = await Product.find({ brand: req.brand._id })
      .select('name SKU stock status category')
      .populate('category', 'name slug');

    res.status(200).json({ success: true, inventory: products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warehouse inventory.' });
  }
};

// @desc    Get warehouse serial numbers listings
// @route   GET /api/inventory/serials
// @access  Private (Role: BRAND)
export const getMySerials = async (req, res) => {
  try {
    const serials = await SerialNumber.find({ brand: req.brand._id })
      .populate('product', 'name SKU modelNumber');

    res.status(200).json({ success: true, serials });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching serial numbers listings.' });
  }
};

// @desc    Seed new serial/IMEI records into inventory
// @route   POST /api/inventory/serials
// @access  Private (Role: BRAND)
export const addSerialNumber = async (req, res) => {
  const { productId, serialNumber, imei1, imei2 } = req.body;

  if (!productId || !serialNumber) {
    return res.status(400).json({ message: 'Product ID and Serial Number are required.' });
  }

  try {
    // Confirm product exists and belongs to brand
    const product = await Product.findOne({ _id: productId, brand: req.brand._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized.' });
    }

    const serialExists = await SerialNumber.findOne({ serialNumber });
    if (serialExists) {
      return res.status(400).json({ message: 'Serial number already exists in database.' });
    }

    const newSerial = await SerialNumber.create({
      serialNumber,
      imei1: imei1 || '',
      imei2: imei2 || '',
      product: productId,
      brand: req.brand._id,
      status: 'Available',
    });

    // Automatically increment product stock quantity!
    product.stock.quantity += 1;
    await product.save();

    res.status(201).json({
      success: true,
      message: `Serial number ${serialNumber} registered and stock level incremented.`,
      serial: newSerial,
    });
  } catch (error) {
    console.error('Error adding serial:', error);
    res.status(500).json({ message: 'Error adding serial number to inventory.' });
  }
};
