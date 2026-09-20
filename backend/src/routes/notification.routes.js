import { Router } from 'express';
import {
  listNotifications,
  markRead,
  markAllRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;