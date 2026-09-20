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
  const fn = checks[spec.type];
  if (!fn) return null;
  return fn(value) ? null : 'invalide';
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