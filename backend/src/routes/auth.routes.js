import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

const registerRules = {
  body: {
    name: { type: 'string' },
    email: { type: 'email' },
    phone: { type: 'phone' },
    password: { type: 'string' },
    asSeller: { optional: true, type: 'boolean' },
  },
};

router.post('/register', validate(registerRules), register);
router.post('/login', validate({ body: { email: { type: 'email' }, password: { type: 'string' } } }), login);

router.use(authenticate);
router.get('/me', getMe);
router.put('/me', validate({ body: { name: { optional: true, type: 'string' }, phone: { optional: true, type: 'phone' }, avatar: { optional: true, type: 'string' } } }), updateMe);

export default router;