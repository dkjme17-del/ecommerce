import { ApiError } from '../lib/apiError.js';

const checks = {
  string: (v) => typeof v === 'string' && v.trim().length > 0,
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === 'boolean',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => /^\+?[0-9\s-]{8,15}$/.test(v),
};

function isMissing(v) {
  return v === undefined || v === null || v === '';
}

function validateField(value, spec) {
  if (isMissing(value)) {
    return spec.optional ? null : 'requis';
  }
  if (spec.type === 'enum') {
    return spec.values.includes(value) ? null : `doit être parmi ${spec.values.join(', ')}`;
  }
  if (spec.type === 'array') {
    if (!Array.isArray(value)) return 'invalide';
    if (spec.maxItems !== undefined && value.length > spec.maxItems) {
      return `doit contenir au plus ${spec.maxItems} éléments`;
    }
    if (spec.items) {
      const check = checks[spec.items];
      if (check && value.some((it) => !check(it))) return 'invalide';
    }
    return null;
  }
  const fn = checks[spec.type];
  if (!fn) return null;
  if (!fn(value)) return 'invalide';
  if (spec.type === 'number' || spec.type === 'integer') {
    if (spec.min !== undefined && value < spec.min) return `doit être ≥ ${spec.min}`;
    if (spec.max !== undefined && value > spec.max) return `doit être ≤ ${spec.max}`;
  } else if (spec.type === 'string') {
    if (spec.minLength !== undefined && value.trim().length < spec.minLength) {
      return `doit contenir au moins ${spec.minLength} caractères`;
    }
    if (spec.maxLength !== undefined && value.trim().length > spec.maxLength) {
      return `doit contenir au plus ${spec.maxLength} caractères`;
    }
  }
  return null;
}

/**
 * validate({ body: {...}, params: {...}, query: {...} })
 * Chaque champ : { type: 'string'|'number'|'integer'|'boolean'|'email'|'phone'|'enum', values?, optional? }
 */
export function validate(rulesets) {
  return (req, _res, next) => {
    try {
      const errors = [];
      for (const [src, rules] of Object.entries(rulesets || {})) {
        for (const [field, spec] of Object.entries(rules)) {
          if (Array.isArray(spec)) {
            for (const s of spec) {
              const err = validateField(req[src][field], s);
              if (err) {
                errors.push(`${field} ${err}`);
                break;
              }
            }
          } else {
            const err = validateField(req[src][field], spec);
            if (err) errors.push(`${field} ${err}`);
          }
        }
      }
      if (errors.length > 0) {
        throw ApiError.badRequest('Validation échouée', errors);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}