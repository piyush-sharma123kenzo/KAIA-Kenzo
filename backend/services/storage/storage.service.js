/**
 * KAIA Technologies — Pluggable Cloud & Local Storage Service
 * 
 * Supports:
 *  - Cloudinary for all Images & Videos (CDN-hosted with automatic optimization)
 *  - Resilient Local Disk Storage (fallback when Cloudinary is not configured)
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

class StorageService {
  /**
   * Check if Cloudinary is configured via environment variables (CLOUDINARY_URL or keys)
   */
  isCloudinaryConfigured() {
    return Boolean(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
       process.env.CLOUDINARY_API_KEY &&
       process.env.CLOUDINARY_API_SECRET)
    );
  }

  /**
   * Configure Cloudinary client
   */
  initCloudinary() {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL.trim(),
        secure: true,
      });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  /**
   * Upload an image or video file from multer (disk or buffer).
   * @param {object} file - Express/Multer file object
   * @param {string} [identifier='asset'] - Identifier or user ID for naming
   * @param {object} [options={}] - Additional upload options ({ folder, resourceType, transformation })
   * @returns {Promise<{ url: string, publicId: string, resourceType: string, updatedAt: Date }>}
   */
  async upload(file, identifier = 'asset', options = {}) {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    // 1. Cloudinary upload provider if configured
    if (this.isCloudinaryConfigured() || (process.env.STORAGE_PROVIDER || '').toLowerCase() === 'cloudinary') {
      try {
        return await this.uploadToCloudinary(file, identifier, options);
      } catch (cloudErr) {
        console.warn('[StorageService] Cloudinary upload error:', cloudErr.message);
        // Fallback to local storage if Cloudinary fails
      }
    }

    // 2. Default Local Storage Provider
    return await this.uploadToLocalStorage(file, identifier, options);
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(file, identifier, options = {}) {
    this.initCloudinary();

    const folder = options.folder || process.env.CLOUDINARY_FOLDER || 'kaia/media';
    const isVideo = (file.mimetype || '').startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.originalname || '');
    const resourceType = options.resourceType || (isVideo ? 'video' : 'image');
    const publicId = `${folder}/${identifier}-${Date.now()}`;

    const uploadOptions = {
      public_id: publicId,
      folder: folder,
      resource_type: resourceType,
    };

    if (!isVideo && !options.noTransform) {
      uploadOptions.transformation = options.transformation || [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    }

    let result;
    if (file.path) {
      result = await cloudinary.uploader.upload(file.path, uploadOptions);
      // Clean up temporary local file if present
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {
        // Ignore unlink error
      }
    } else if (file.buffer) {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        uploadStream.end(file.buffer);
      });
    } else {
      throw new Error('Invalid file structure provided to storage uploader.');
    }

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      resourceType: result.resource_type || resourceType,
      format: result.format,
      bytes: result.bytes,
      updatedAt: new Date(),
    };
  }

  /**
   * Save file to local disk storage directory
   */
  async uploadToLocalStorage(file, identifier, options = {}) {
    const isVideo = (file.mimetype || '').startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.originalname || '');
    const subfolder = isVideo ? 'videos' : (options.subfolder || 'media');
    const uploadDir = path.join(process.cwd(), 'uploads', subfolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname || (isVideo ? '.mp4' : '.jpg')).toLowerCase() || (isVideo ? '.mp4' : '.jpg');
    const filename = `${identifier}-${Date.now()}${ext}`;
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

    const publicUrl = `/uploads/${subfolder}/${filename}`;
    return {
      url: publicUrl,
      publicId: `local:${subfolder}/${filename}`,
      resourceType: isVideo ? 'video' : 'image',
      updatedAt: new Date(),
    };
  }

  /**
   * Safely delete a file from storage.
   * @param {string} publicId - Storage identifier or relative local URL
   * @param {string} [url=''] - Fallback URL
   * @param {string} [resourceType='image'] - 'image' | 'video' | 'raw'
   * @returns {Promise<boolean>}
   */
  async delete(publicId, url = '', resourceType = 'image') {
    if (!publicId && !url) return true;

    try {
      // 1. If stored in Cloudinary
      if (publicId && !publicId.startsWith('local:') && !publicId.startsWith('/')) {
        if (this.isCloudinaryConfigured()) {
          this.initCloudinary();
          const isVideo = resourceType === 'video' || (url && /\.(mp4|webm|mov|mkv|avi)$/i.test(url));
          await cloudinary.uploader.destroy(publicId, {
            resource_type: isVideo ? 'video' : 'image'
          });
          return true;
        }
      }

      // 2. If stored locally
      let subPath = '';
      if (publicId && publicId.startsWith('local:')) {
        subPath = publicId.replace('local:', '');
      } else if (url && url.includes('/uploads/')) {
        subPath = url.replace('/uploads/', '');
      }

      if (subPath) {
        const filePath = path.join(process.cwd(), 'uploads', subPath);
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

