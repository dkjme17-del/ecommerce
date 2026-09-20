import { Router } from 'express';
import {
  createStore,
  getMyStore,
  updateStore,
  getPublicStore,
} from '../controllers/store.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRoles('SELLER'),
  validate({
    body: {
      name: { type: 'string' },
      description: { optional: true, type: 'string' },
      logo: { optional: true, type: 'string' },
      banner: { optional: true, type: 'string' },
      payoutInfo: { optional: true },
    },
  }),
  createStore,
);
router.get('/me', authenticate, requireRoles('SELLER'), getMyStore);
router.put('/me', authenticate, requireRoles('SELLER'), updateStore);
router.get('/:slug', getPublicStore);

export default router;