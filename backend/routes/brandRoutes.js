import express from 'express';
import { registerBrand, getBrands, getBrandBySlug, getMyBrand, updateMyBrand } from '../controllers/brandController.js';
import { getProducts } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBrands);
router.post('/register', protect, authorize('BRAND'), registerBrand);
router.get('/my-brand', protect, authorize('BRAND'), getMyBrand);
router.put('/my-brand', protect, authorize('BRAND'), updateMyBrand);
router.get('/:slug', getBrandBySlug);
router.get('/:slug/products', (req, res, next) => {
  req.query.brand = req.params.slug;
  return getProducts(req, res, next);
});

export default router;
