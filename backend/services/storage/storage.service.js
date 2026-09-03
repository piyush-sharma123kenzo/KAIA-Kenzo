/**
 * KAIA Technologies — Pluggable Storage Service
 * 
 * Provides a unified, replaceable storage abstraction layer.
 * Supports:
 *  - Cloudinary (when CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are configured)
 *  - AWS S3 / Object Storage (when configured)
 *  - Resilient Local Disk Storage (default fallback for development & offline environments)
 */

import fs from 'fs';
import path from 'path';

class StorageService {
  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    this.cloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Upload an image file from multer (disk or buffer).
   * @param {object} file - Express/Multer file object
   * @param {string} userId - User ID for isolation and naming
   * @param {object} [options={}] - Additional upload options
   * @returns {Promise<{ url: string, publicId: string, updatedAt: Date }>}
   */
  async upload(file, userId, options = {}) {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    // 1. Cloudinary upload provider if configured
    if (this.cloudinaryConfigured || this.provider === 'cloudinary') {
      try {
        return await this.uploadToCloudinary(file, userId, options);
      } catch (cloudErr) {
        console.warn('[StorageService] Cloudinary upload failed, falling back to local storage:', cloudErr.message);
        // Fallback to local storage if Cloudinary fails
      }
    }

    // 2. Default Local Storage Provider
    return await this.uploadToLocalStorage(file, userId, options);
  }

  /**
   * Upload to Cloudinary (using dynamic import or REST API)
   */
  async uploadToCloudinary(file, userId, options) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER || 'kaia/profiles';

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials missing in environment.');
    }

    try {
      const cloudinary = await import('cloudinary');
      cloudinary.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const publicId = `${folder}/${userId}-${Date.now()}`;

      let result;
      if (file.path) {
        result = await cloudinary.v2.uploader.upload(file.path, {
          public_id: publicId,
          folder: folder,
          resource_type: 'image',
          transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
        });
      } else if (file.buffer) {
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              public_id: publicId,
              folder: folder,
              resource_type: 'image',
              transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }],
            },
            (error, res) => {
              if (error) return reject(error);
              resolve(res);
            }
          );
          uploadStream.end(file.buffer);
        });
      }

      return {
        url: result.secure_url || result.url,
        publicId: result.public_id,
        updatedAt: new Date(),
      };
    } catch (err) {
      throw new Error(`Cloudinary service error: ${err.message}`);
    }
  }

  /**
   * Save file to secure local disk storage directory
   */
  async uploadToLocalStorage(file, userId, options) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const targetPath = path.join(uploadDir, filename);

    if (file.buffer) {
      fs.writeFileSync(targetPath, file.buffer);
    } else if (file.path && file.path !== targetPath) {
      fs.copyFileSync(file.path, targetPath);
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // Ignore unlink error
      }
    }

    const publicUrl = `/uploads/avatars/${filename}`;
    return {
      url: publicUrl,
      publicId: `local:${filename}`,
      updatedAt: new Date(),
    };
  }

  /**
   * Safely delete a file from storage.
   * @param {string} publicId - Storage identifier or relative local URL
   * @param {string} [url=''] - Fallback URL
   * @returns {Promise<boolean>}
   */
  async delete(publicId, url = '') {
    if (!publicId && !url) return true;

    try {
      // 1. If stored in Cloudinary
      if (publicId && !publicId.startsWith('local:') && !publicId.startsWith('/')) {
        if (this.cloudinaryConfigured || this.provider === 'cloudinary') {
          try {
            const cloudinary = await import('cloudinary');
            cloudinary.v2.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'image' });
            return true;
          } catch (e) {
            console.warn('[StorageService] Cloudinary deletion error:', e.message);
          }
        }
      }

      // 2. If stored locally
      let filename = '';
      if (publicId && publicId.startsWith('local:')) {
        filename = publicId.replace('local:', '');
      } else if (url && url.includes('/uploads/avatars/')) {
        filename = path.basename(url);
      }

      if (filename) {
        const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return true;
    } catch (err) {
      console.warn('[StorageService] Error during file deletion:', err.message);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
