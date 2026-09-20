import { Router } from 'express';
import {
  stats,
  orders,
  updateOrderItemStatus,
  payouts,
} from '../controllers/seller.controller.js';
import { authenticate, requireRoles, requireActiveStore } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, requireRoles('SELLER'), requireActiveStore);

router.get('/stats', stats);
router.get('/orders', orders);
router.patch('/orders/:id/status', updateOrderItemStatus);
router.get('/payouts', payouts);

export default router;