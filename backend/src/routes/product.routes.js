import { Router } from 'express';
import {
  listProducts,
  getProductBySlug,
  storeProducts,
  featuredProducts,
  sellerListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from '../controllers/product.controller.js';
import { authenticate, requireRoles, requireActiveStore } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const sellerGuard = [authenticate, requireRoles('SELLER'), requireActiveStore];

router.get('/featured', featuredProducts);
router.get('/store/:storeId', storeProducts);
router.get('/seller/all', ...sellerGuard, sellerListProducts);

router.get('/', listProducts);

router.post(
  '/',
  ...sellerGuard,
  validate({
    body: {
      name: { type: 'string' },
      price: { type: 'integer' },
      categoryId: { type: 'string' },
      stock: { optional: true, type: 'integer' },
      compareAtPrice: { optional: true, type: 'integer' },
    },
  }),
  createProduct,
);
router.put('/:id', ...sellerGuard, updateProduct);
router.patch(
  '/:id/stock',
  ...sellerGuard,
  validate({ body: { stock: { type: 'integer' } } }),
  updateStock,
);
router.delete('/:id', ...sellerGuard, deleteProduct);

router.get('/:slug', getProductBySlug);

export default router;