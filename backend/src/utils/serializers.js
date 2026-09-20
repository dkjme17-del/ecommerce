export function paginate(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export function publicStore(store) {
  if (!store) return null;
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logo: store.logo,
    banner: store.banner,
    status: store.status,
    commissionRate: store.commissionRate,
    createdAt: store.createdAt,
  };
}