import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  cancelOrder,
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate({
    body: {
      paymentMethod: { type: 'enum', values: ['WAVE', 'ORANGE_MONEY', 'MTN_MOMO'] },
      shippingAddress: { optional: true },
      items: { optional: true },
      shippingFee: { optional: true, type: 'integer' },
    },
  }),
  createOrder,
);
router.get('/my', myOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

export default router;