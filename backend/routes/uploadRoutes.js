import express from 'express';
import multer from 'multer';
import path from 'path';
import storageService from '../services/storage.service.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Pure in-memory storage engine for streaming uploads directly to Cloudinary
const memoryStorage = multer.memoryStorage();

// Media validation filter (Images + Videos)
function checkMediaType(file, cb) {
  const allowedExts = /jpg|jpeg|png|webp|svg|gif|avif|mp4|webm|mov|mkv|avi/i;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = (file.mimetype || '').toLowerCase();

  const isImage = mime.startsWith('image/') || allowedExts.test(ext);
  const isVideo = mime.startsWith('video/') || allowedExts.test(ext);

  if (isImage || isVideo) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only images (JPG, PNG, WEBP, SVG, AVIF) and videos (MP4, WEBM, MOV) are allowed.'));
  }
}

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit to support videos
  fileFilter(req, file, cb) {
    checkMediaType(file, cb);
  },
});

// Require authentication for uploads
router.use(protect);

// @desc    Upload single image or video
// @route   POST /api/upload
router.post('/', upload.single('image'), async (req, res) => {
  const file = req.file || req.files?.[0];
  if (!file) {
    return res.status(400).json({ success: false, message: 'No media file uploaded.' });
  }

  try {
    const isVideo = (file.mimetype || '').startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.originalname || '');
    const folder = req.body.folder || (isVideo ? 'kaia/videos' : 'kaia/products');

    const result = await storageService.upload(file, 'media', {
      folder,
      resourceType: isVideo ? 'video' : 'image',
    });

    res.status(200).json({
      success: true,
      message: `${isVideo ? 'Video' : 'Image'} uploaded successfully.`,
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
    });
  } catch (err) {
    console.error('[Upload API] Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload media file.',
    });
  }
});

// @desc    Upload single video
// @route   POST /api/upload/video
router.post('/video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file uploaded.' });
  }

  try {
    const folder = req.body.folder || 'kaia/videos';
    const result = await storageService.upload(req.file, 'video', {
      folder,
      resourceType: 'video',
    });

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully.',
      url: result.url,
      publicId: result.publicId,
      resourceType: 'video',
    });
  } catch (err) {
    console.error('[Upload Video API] Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload video.',
    });
  }
});

// @desc    Upload multiple product media files (up to 10)
// @route   POST /api/upload/multiple
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No media files uploaded.' });
  }

  try {
    const uploadPromises = req.files.map((file) => {
      const isVideo = (file.mimetype || '').startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.originalname || '');
      const folder = req.body.folder || (isVideo ? 'kaia/videos' : 'kaia/products');
      return storageService.upload(file, 'media', { folder, resourceType: isVideo ? 'video' : 'image' });
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    res.status(200).json({
      success: true,
      message: `${results.length} files uploaded successfully.`,
      urls,
      assets: results,
    });
  } catch (err) {
    console.error('[Upload Multiple API] Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to upload multiple files.',
    });
  }
});

export default router;

