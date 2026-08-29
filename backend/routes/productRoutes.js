import express from 'express';
import {
  getProducts,
  getProductBySlug,
  getSearchSuggestions,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, checkBrandApproval } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/suggestions', getSearchSuggestions);

// Brand seller endpoints
router.get('/seller/my-products', protect, checkBrandApproval, getMyProducts);
router.post('/seller/create', protect, checkBrandApproval, createProduct);
router.put('/seller/update/:id', protect, checkBrandApproval, updateProduct);
router.delete('/seller/delete/:id', protect, checkBrandApproval, deleteProduct);

// Dynamic slug lookup goes at the bottom so it doesn't hijack other routes
router.get('/:slug', getProductBySlug);

export default router;
