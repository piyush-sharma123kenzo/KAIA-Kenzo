import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Define storage engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// File validation filter
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|svg|gif|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('image/');

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp, svg, avif)!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

// @desc    Upload single image
// @route   POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  const normalizedPath = req.file.path.replace(/\\/g, '/');

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully.',
    url: `/${normalizedPath}`,
    filename: req.file.filename,
  });
});

// @desc    Upload multiple product images (up to 10)
// @route   POST /api/upload/multiple
router.post('/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No image files uploaded.' });
  }

  const urls = req.files.map((file) => `/${file.path.replace(/\\/g, '/')}`);

  res.status(200).json({
    success: true,
    message: `${req.files.length} images uploaded successfully.`,
    urls,
  });
});

export default router;
