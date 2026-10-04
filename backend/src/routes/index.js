import { Router } from 'express';
import { env } from '../config/env.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import storeRoutes from './store.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import sellerRoutes from './seller.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.get('/status', (_req, res) =>
  res.json({ status: 'ok', service: 'dkmarket-api', time: new Date().toISOString() }),
);

router.get('/config', (_req, res) =>
  res.json({
    config: {
      commissionRate: env.commissionRate,
      minPayoutAmount: env.minPayoutAmount,
      paymentMode: env.paymentMode,
      paymentProvider: env.paymentProvider,
    },
  }),
);

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/products', reviewRoutes);
router.use('/stores', storeRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;