/**
 * KAIA Technologies — Upload Middleware & Validation
 * 
 * Secure file upload middleware configured with:
 *  - 5 MB maximum file size limit
 *  - Strict MIME & extension filter (JPG, JPEG, PNG, WEBP only)
 *  - Custom error handlers for clean client error responses
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Temporary disk storage for processing uploads
const tempStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/temp/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

// Allowed file types: JPG, JPEG, PNG, WEBP
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = /^\.(jpg|jpeg|png|webp)$/i;

/**
 * File filter to strictly enforce allowed image formats
 */
const profileImageFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isExtValid = ALLOWED_EXTENSIONS.test(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.has(mime);

  if (isExtValid && isMimeValid) {
    return cb(null, true);
  }

  const error = new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are allowed.');
  error.code = 'INVALID_FILE_TYPE';
  return cb(error, false);
};

// 5 MB maximum size limit
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const uploadInstance = multer({
  storage: tempStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: profileImageFilter,
});

/**
 * Middleware wrapper to catch Multer errors and format JSON responses cleanly
 */
export const uploadProfileImageMiddleware = (req, res, next) => {
  // Support fields: 'profileImage', 'avatar', 'image'
  const uploadHandler = uploadInstance.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Profile image must be smaller than 5 MB.',
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.message?.includes('Invalid file format')) {
        return res.status(400).json({
          success: false,
          message: 'Only JPG, JPEG, PNG, and WEBP image files are allowed.',
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error occurred while processing file upload.',
      });
    }

    // Extract file from fields if present
    if (req.files) {
      req.file = req.files.profileImage?.[0] || req.files.avatar?.[0] || req.files.image?.[0] || null;
    }

    next();
  });
};

export default uploadProfileImageMiddleware;
