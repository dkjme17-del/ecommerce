import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get('/', listCategories);
router.post(
  '/',
  authenticate,
  requireRoles('ADMIN'),
  validate({ body: { name: { type: 'string' } } }),
  createCategory,
);
router.put('/:id', authenticate, requireRoles('ADMIN'), updateCategory);
router.delete('/:id', authenticate, requireRoles('ADMIN'), deleteCategory);

export default router;