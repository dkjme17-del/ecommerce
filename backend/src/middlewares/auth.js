import { verifyToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/apiError.js';

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw ApiError.unauthorized('Token manquant');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Token invalide ou expiré');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { store: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Compte introuvable');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Compte suspendu');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    const hasRole = roles.some((r) => req.user.roles.includes(r));
    if (!hasRole) {
      return next(ApiError.forbidden(`Rôle requis : ${roles.join(', ')}`));
    }
    next();
  };
}

export function requireActiveStore(req, _res, next) {
  const store = req.user?.store;
  if (!store || store.status !== 'APPROVED') {
    return next(ApiError.forbidden('Boutique non validée ou inexistante'));
  }
  req.store = store;
  next();
}