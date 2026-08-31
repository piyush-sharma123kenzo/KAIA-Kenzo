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
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

// 1. Static Public Search & Suggestion Endpoints
router.get('/', getProducts);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/suggestions', getSearchSuggestions);

// 2. Curated Product Collections
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

// 5. Standard REST CRUD endpoints
router.post('/', protect, checkBrandApproval, createProduct);
router.put('/:id', protect, checkBrandApproval, updateProduct);
router.patch('/:id', protect, checkBrandApproval, updateProduct);
router.delete('/:id', protect, checkBrandApproval, deleteProduct);

// 6. Dynamic slug lookup goes at the bottom so it doesn't hijack other routes
router.get('/:slug', getProductBySlug);

export default router;
