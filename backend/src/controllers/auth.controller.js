import { ApiError } from '../lib/apiError.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { publicUser } from '../utils/serializers.js';
import { createNotification } from '../services/notification.service.js';

const ALLOWED_SELF_REGISTRATION = ['CUSTOMER'];

export async function register(req, res, next) {
  try {
    const { name, email, phone, password, asSeller } = req.body;
    // Ne jamais faire confiance aux rôles envoyés par le client : seuls CUSTOMER
    // (et éventuellement SELLER via un flag explicite) peuvent être auto-attribués.
    const roles = asSeller
      ? ['CUSTOMER', 'SELLER']
      : [...ALLOWED_SELF_REGISTRATION];

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (exists) {
      throw ApiError.conflict('Un compte existe déjà avec cet email ou ce téléphone');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        password: await hashPassword(password),
        roles,
      },
    });

    await createNotification(user.id, 'Bienvenue !', `Votre compte marketplace est créé.`);

    const token = signToken({ sub: user.id, roles: user.roles });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: (email || '').toLowerCase() },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Compte suspendu. Contactez l’administrateur.');
    }

    const token = signToken({ sub: user.id, roles: user.roles });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function updateMe(req, res, next) {
  try {
    const { name, phone, avatar } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) {
      const dup = await prisma.user.findFirst({
        where: { phone, NOT: { id: req.user.id } },
      });
      if (dup) throw ApiError.conflict('Ce téléphone est déjà utilisé');
      data.phone = phone;
    }
    if (avatar !== undefined) data.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}