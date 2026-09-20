import { Router } from 'express';
import {
  initiatePayment,
  paymentStatus,
  webhook,
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/momo/initiate',
  authenticate,
  validate({
    body: {
      orderId: { type: 'string' },
      phone: { type: 'phone' },
    },
  }),
  initiatePayment,
);
router.get('/momo/status/:reference', authenticate, paymentStatus);
router.post('/webhook/momo', webhook);

export default router;