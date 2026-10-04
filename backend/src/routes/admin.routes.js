import { Router } from 'express';
import {
  stats,
  sales,
  commissions,
  listStores,
  validateStore,
  listUsers,
  updateUserStatus,
  listProducts,
  updateProductStatus,
  pendingPayouts,
  processOnePayout,
  runAutoPayouts,
} from '../controllers/admin.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'));

router.get('/stats', stats);
router.get('/sales', sales);
router.get('/commissions', commissions);
router.get('/stores', listStores);
router.patch('/stores/:id/validate', validateStore);
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/products', listProducts);
router.patch('/products/:id/status', updateProductStatus);
router.get('/payouts/pending', pendingPayouts);
router.post('/payouts/:id/process', processOnePayout);
router.post('/payouts/auto', runAutoPayouts);

export default router;