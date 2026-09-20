import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post(
  '/items',
  validate({
    body: {
      productId: { type: 'string' },
      quantity: { optional: true, type: 'integer' },
    },
  }),
  addItem,
);
router.patch(
  '/items/:productId',
  validate({ body: { quantity: { type: 'integer' } } }),
  updateItemQuantity,
);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;