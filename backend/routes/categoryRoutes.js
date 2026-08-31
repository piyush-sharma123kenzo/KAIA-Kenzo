import express from 'express';
import { getCategories, getCategoryBySlug } from '../controllers/categoryController.js';
import { getProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.get('/:slug/products', (req, res, next) => {
  req.query.category = req.params.slug;
  return getProducts(req, res, next);
});

export default router;
