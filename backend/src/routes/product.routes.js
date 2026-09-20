import { Router } from 'express';
import {
  listProducts,
  getProductBySlug,
  storeProducts,
  featuredProducts,
  sellerListProducts,
  getSellerProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from '../controllers/product.controller.js';
import { authenticate, requireRoles, requireActiveStore } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const sellerGuard = [authenticate, requireRoles('SELLER'), requireActiveStore];

const productBody = {
  name: { type: 'string', minLength: 2, maxLength: 120 },
  price: { type: 'integer', min: 1, max: 100000000 },
  compareAtPrice: { optional: true, type: 'integer', min: 0, max: 100000000 },
  stock: { type: 'integer', min: 0, max: 1000000 },
  categoryId: { type: 'string' },
  description: { optional: true, type: 'string', maxLength: 2000 },
  images: { optional: true, type: 'array', maxItems: 8, items: 'string' },
};

router.get('/featured', featuredProducts);
router.get('/store/:storeId', storeProducts);
router.get('/seller/all', ...sellerGuard, sellerListProducts);
router.get('/seller/:id', ...sellerGuard, getSellerProduct);

router.get('/', listProducts);

router.post(
  '/',
  ...sellerGuard,
  validate({ body: productBody }),
  createProduct,
);
router.put(
  '/:id',
  ...sellerGuard,
  validate({
    body: Object.fromEntries(
      Object.entries(productBody).map(([k, v]) => [k, { ...v, optional: true }]),
    ),
  }),
  updateProduct,
);
router.patch(
  '/:id/stock',
  ...sellerGuard,
  validate({ body: { stock: { type: 'integer', min: 0, max: 1000000 } } }),
  updateStock,
);
router.delete('/:id', ...sellerGuard, deleteProduct);

router.get('/:slug', getProductBySlug);

export default router;