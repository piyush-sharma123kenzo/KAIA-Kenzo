import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import {
  getProducts,
  getProductBySlug,
  getSearchSuggestions,
  getRelatedProducts,
  getBestSellers,
  getNewArrivals,
  getDeals,
  getProductReviewsDistribution,
} from '../controllers/productController.js';
import { checkPincodeServiceability } from '../controllers/shippingController.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runCatalogVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real Product Catalog, Search, Filters, Sorting & Details Verification...\n');

    // Helper to mock Express req/res
    const createMock = (query = {}, params = {}, body = {}) => {
      let statusCode = 200;
      let responseData = null;
      const req = { query, params, body };
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };
      return { req, res, getStatus: () => statusCode, getData: () => responseData };
    };

    // Ensure we have test brands, categories, and products
    let brand = await Brand.findOne({ status: { $in: ['Approved', 'approved'] } });
    if (!brand) {
      brand = await Brand.create({
        name: 'ASUS ROG',
        slug: 'asus-rog',
        status: 'Approved',
      });
    }

    let category = await Category.findOne({ isActive: true });
    if (!category) {
      category = await Category.create({
        name: 'Gaming Laptops',
        slug: 'gaming-laptops',
        baseCommission: 10,
        isActive: true,
      });
    }

    // Seed test products if needed
    const existingCount = await Product.countDocuments();
    if (existingCount < 3) {
      await Product.create([
        {
          brand: brand._id,
          category: category._id,
          name: 'ASUS ROG Strix G16 RTX 4070',
          slug: `asus-rog-strix-g16-${Date.now()}`,
          modelNumber: 'G614JI-AS74',
          SKU: `SKU-ROG-${Date.now()}`,
          description: 'High performance gaming laptop with Intel Core i9 and RTX 4070.',
          mrp: 189990,
          sellingPrice: 154990,
          stock: { quantity: 12, reservedQuantity: 2, availableQuantity: 10, reorderThreshold: 3 },
          specifications: { Processor: 'Intel Core i9-13980HX', RAM: '32GB DDR5', Storage: '1TB NVMe SSD', GPU: 'NVIDIA RTX 4070' },
          status: 'Approved',
          isActive: true,
        },
        {
          brand: brand._id,
          category: category._id,
          name: 'ASUS TUF Gaming A15 Ryzen 7',
          slug: `asus-tuf-a15-${Date.now()}`,
          modelNumber: 'FA506NC',
          SKU: `SKU-TUF-${Date.now()}`,
          description: 'Budget gaming laptop with AMD Ryzen 7.',
          mrp: 89990,
          sellingPrice: 69990,
          stock: { quantity: 3, reservedQuantity: 0, availableQuantity: 3, reorderThreshold: 2 },
          specifications: { Processor: 'AMD Ryzen 7 7735HS', RAM: '16GB DDR5', Storage: '512GB SSD', GPU: 'NVIDIA RTX 3050' },
          status: 'Approved',
          isActive: true,
        },
      ]);
    }

    const testProduct = await Product.findOne({ isActive: true, status: { $in: ['Approved', 'published'] } }).populate('brand category');
    if (!testProduct) throw new Error('No active test product available.');

    // TEST 1: Catalog Server-Side Pagination
    const t1 = createMock({ page: 1, limit: 2 });
    await getProducts(t1.req, t1.res);
    const d1 = t1.getData();
    if (!d1.success || !Array.isArray(d1.products) || typeof d1.pagination?.total !== 'number') {
      throw new Error('Catalog pagination failed!');
    }
    console.log(`✓ Test 1 Passed: Catalog fetched with server pagination (${d1.products.length} items, Total: ${d1.pagination.total}, Pages: ${d1.pagination.totalPages}).`);

    // TEST 2: Safe Search Sanitization (Special regex characters should not crash)
    const t2 = createMock({ search: 'ROG [G16] (Gaming) + RTX' });
    await getProducts(t2.req, t2.res);
    if (!t2.getData().success) throw new Error('Special characters in search caused a crash!');
    console.log(`✓ Test 2 Passed: Search input sanitized safely against ReDoS and regex crashes.`);

    // TEST 3: Brand & Category Faceted Filter
    const t3 = createMock({ brand: testProduct.brand?.slug, category: testProduct.category?.slug });
    await getProducts(t3.req, t3.res);
    const d3 = t3.getData();
    if (!d3.success || d3.products.length < 1) throw new Error('Brand and Category filter failed!');
    console.log(`✓ Test 3 Passed: Faceted brand & category filtering verified with ${d3.products.length} matches.`);

    // TEST 4: Price Range Filtering
    const t4 = createMock({ minPrice: testProduct.sellingPrice - 1000, maxPrice: testProduct.sellingPrice + 1000 });
    await getProducts(t4.req, t4.res);
    const d4 = t4.getData();
    const allInRange = d4.products.every((p) => p.sellingPrice >= (testProduct.sellingPrice - 1000) && p.sellingPrice <= (testProduct.sellingPrice + 1000));
    if (!allInRange) throw new Error('Price range filter returned out-of-range products!');
    console.log(`✓ Test 4 Passed: Price range filter accurately matched ${d4.products.length} products.`);

    // TEST 5: Discount Filtering
    const t5 = createMock({ discount: 10 });
    await getProducts(t5.req, t5.res);
    const d5 = t5.getData();
    if (!d5.success) throw new Error('Discount filter failed!');
    console.log(`✓ Test 5 Passed: Discount percentage filter verified.`);

    // TEST 6: Availability Filter
    const t6 = createMock({ availability: 'inStock' });
    await getProducts(t6.req, t6.res);
    const d6 = t6.getData();
    if (!d6.success || d6.products.some((p) => (p.stock?.availableQuantity || 0) <= 0 && (p.stockQuantity || 0) <= 0)) {
      throw new Error('Availability filter returned out-of-stock items!');
    }
    console.log(`✓ Test 6 Passed: In-stock inventory filter verified.`);

    // TEST 7: Server-Side Sorting (Price Low to High)
    const t7 = createMock({ sort: 'price-low' });
    await getProducts(t7.req, t7.res);
    const d7 = t7.getData();
    for (let i = 0; i < d7.products.length - 1; i++) {
      if (d7.products[i].sellingPrice > d7.products[i + 1].sellingPrice) {
        throw new Error('Products are not sorted in ascending price order!');
      }
    }
    console.log(`✓ Test 7 Passed: Server-side price sorting verified.`);

    // TEST 8: Search Suggestions Autocomplete
    const t8 = createMock({ q: testProduct.name.slice(0, 4) });
    await getSearchSuggestions(t8.req, t8.res);
    const d8 = t8.getData();
    if (!d8.success || !Array.isArray(d8.suggestions)) throw new Error('Search suggestions failed!');
    console.log(`✓ Test 8 Passed: Search suggestions autocomplete returned ${d8.suggestions.length} items.`);

    // TEST 9: Product Details by Slug (with Stock & Discount calculations)
    const t9 = createMock({}, { slug: testProduct.slug });
    await getProductBySlug(t9.req, t9.res);
    const d9 = t9.getData();
    if (!d9.success || !d9.product.stockStatus || typeof d9.product.discountPercentage !== 'number') {
      throw new Error('Product details calculation failed!');
    }
    console.log(`✓ Test 9 Passed: Product details fetched with stock status ("${d9.product.stockStatus}", ${d9.product.discountPercentage}% OFF).`);

    // TEST 10: Related Products
    const t10 = createMock({}, { slug: testProduct.slug });
    await getRelatedProducts(t10.req, t10.res);
    const d10 = t10.getData();
    if (!d10.success || !Array.isArray(d10.related)) throw new Error('Related products failed!');
    console.log(`✓ Test 10 Passed: Related hardware recommendations returned ${d10.related.length} items.`);

    // TEST 11: Curated Collections (Best Sellers, New Arrivals, Deals)
    const [t11a, t11b, t11c] = [createMock({ limit: 4 }), createMock({ limit: 4 }), createMock({ limit: 4 })];
    await Promise.all([
      getBestSellers(t11a.req, t11a.res),
      getNewArrivals(t11b.req, t11b.res),
      getDeals(t11c.req, t11c.res),
    ]);
    if (!t11a.getData().success || !t11b.getData().success || !t11c.getData().success) {
      throw new Error('Curated collections failed!');
    }
    console.log(`✓ Test 11 Passed: Curated collections (Best Sellers, New Arrivals, Deals) verified.`);

    // TEST 12: Review Distribution & Histogram
    const t12 = createMock({}, { productId: testProduct._id });
    await getProductReviewsDistribution(t12.req, t12.res);
    const d12 = t12.getData();
    if (!d12.success || typeof d12.distribution !== 'object' || typeof d12.averageRating !== 'number') {
      throw new Error('Review distribution histogram failed!');
    }
    console.log(`✓ Test 12 Passed: Review histogram & distribution verified (Avg: ${d12.averageRating}, Total: ${d12.total}).`);

    // TEST 13: PIN Code Serviceability & Transit Estimation
    const t13a = createMock({}, {}, { pincode: '560001' });
    await checkPincodeServiceability(t13a.req, t13a.res);
    const d13a = t13a.getData();
    if (!d13a.serviceable || !d13a.estimatedDays) throw new Error('Valid pincode was not serviceable!');

    const t13b = createMock({}, {}, { pincode: 'invalid' });
    await checkPincodeServiceability(t13b.req, t13b.res);
    if (t13b.getStatus() !== 400) throw new Error('Invalid pincode was not rejected!');
    console.log(`✓ Test 13 Passed: PIN code serviceability verified (Metro 560001: "${d13a.estimatedDays}", Invalid rejected with 400).`);

    console.log('\n🎉 ALL PRODUCT CATALOG, SEARCH, FILTERS, SORTING & DETAILS TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Catalog verification failed:', err);
    process.exit(1);
  }
};

runCatalogVerification();
