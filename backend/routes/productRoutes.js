import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getSearchSuggestions,
  getRelatedProducts,
  getBestSellers,
  getNewArrivals,
  getDeals,
  getProductReviewsDistribution,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import {
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminProductStock,
  toggleAdminProductStatus,
  addAdminProductImages,
  deleteAdminProductImage,
} from '../controllers/adminProductController.js';
import { protect, checkBrandApproval, authorize } from '../middleware/auth.js';

const router = express.Router();

// 1. Static Public Search & Suggestion Endpoints
router.get('/', getProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/suggestions', getSearchSuggestions);

// 2. Curated Product Collections (Live MongoDB Data)
router.get('/collections/best-sellers', getBestSellers);
router.get('/collections/new-arrivals', getNewArrivals);
router.get('/collections/deals', getDeals);

// 3. Brand seller endpoints
router.get('/seller/my-products', protect, checkBrandApproval, getMyProducts);
router.post('/seller/create', protect, checkBrandApproval, createProduct);
router.put('/seller/update/:id', protect, checkBrandApproval, updateProduct);
router.delete('/seller/delete/:id', protect, checkBrandApproval, deleteProduct);

// 4. Product Reviews & Related Products by Slug/Id
router.get('/:productId/reviews', getProductReviewsDistribution);
router.get('/:slug/related', getRelatedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/id/:id', getProductBySlug);

// 5. Admin & Management CRUD endpoints
// Supports Admin direct creation/updates as well as approved brand management
const adminOrBrandProtect = (req, res, next) => {
  protect(req, res, () => {
    if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') {
      return next();
    }
    return checkBrandApproval(req, res, next);
  });
};

router.post('/', adminOrBrandProtect, (req, res, next) => {
  if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') return createAdminProduct(req, res, next);
  return createProduct(req, res, next);
});

router.put('/:id', adminOrBrandProtect, (req, res, next) => {
  if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') return updateAdminProduct(req, res, next);
  return updateProduct(req, res, next);
});

router.patch('/:id', adminOrBrandProtect, (req, res, next) => {
  if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') return updateAdminProduct(req, res, next);
  return updateProduct(req, res, next);
});

router.delete('/:id', adminOrBrandProtect, (req, res, next) => {
  if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') return deleteAdminProduct(req, res, next);
  return deleteProduct(req, res, next);
});

router.patch('/:id/status', adminOrBrandProtect, toggleAdminProductStatus);
router.patch('/:id/stock', adminOrBrandProtect, updateAdminProductStock);
router.post('/:id/images', adminOrBrandProtect, addAdminProductImages);
router.delete('/:id/images/:imageId', adminOrBrandProtect, deleteAdminProductImage);

// 6. Dynamic slug lookup goes at the bottom so it doesn't hijack other routes
router.get('/:slug', getProductBySlug);

export default router;
