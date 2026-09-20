export function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export async function uniqueSlug(base, findFn) {
  const slug = slugify(base);
  let candidate = slug;
  let n = 1;
  while (await findFn(candidate)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}