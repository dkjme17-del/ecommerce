import { Router } from 'express';
import { listReviews, createReview } from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get('/:slug/reviews', listReviews);
router.post(
  '/:slug/reviews',
  authenticate,
  validate({
    body: {
      rating: { type: 'integer' },
      comment: { optional: true, type: 'string' },
    },
  }),
  createReview,
);

export default router;