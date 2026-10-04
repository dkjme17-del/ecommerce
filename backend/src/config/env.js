import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

function required(key) {
  if (!process.env[key]) {
    throw new Error(`[env] ${key} est obligatoire en production.`);
  }
  return process.env[key];
}

const isProduction = process.env.NODE_ENV === 'production';

// Hors production, un secret non défini est remplacé par une valeur aléatoire
// générée à chaque démarrage (jamais un secret prévisible codé en dur).
const devJwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString('base64');
const devWebhookSecret = process.env.WAVE_WEBHOOK_SECRET || crypto.randomBytes(48).toString('base64');

const paymentMode = process.env.PAYMENT_MODE || 'sandbox';
const livePayments = isProduction && paymentMode === 'live';

const geniuspayApiKey = process.env.GENIUSPAY_API_KEY || '';
const geniuspayApiSecret = process.env.GENIUSPAY_API_SECRET || '';
const geniuspayConfigured = Boolean(geniuspayApiKey && geniuspayApiSecret);
const paymentProvider = process.env.PAYMENT_PROVIDER || (geniuspayConfigured ? 'geniuspay' : 'sandbox');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT || '4000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  databaseUrl: isProduction
    ? required('DATABASE_URL')
    : process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/ecommerce',
  jwtSecret: isProduction ? required('JWT_SECRET') : devJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  commissionRate: parseFloat(process.env.COMMISSION_RATE || '0.01'),
  paymentMode,
  paymentProvider,
  paymentSandboxDelayMs: parseInt(process.env.PAYMENT_SANDBOX_DELAY_MS || '3000', 10),
  minPayoutAmount: parseInt(process.env.MIN_PAYOUT_AMOUNT || '5000', 10),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  // GeniusPay — https://geniuspay.ci/docs/api
  geniuspayApiKey,
  geniuspayApiSecret,
  geniuspayWebhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || '',
  geniuspayBaseUrl:
    process.env.GENIUSPAY_BASE_URL || 'https://geniuspay.ci/api/v1/merchant',
  // Wave (Checkout API — https://docs.wave.com/checkout)
  // Exigé uniquement lorsque le fournisseur actif est Wave.
  waveApiKey:
    paymentProvider === 'wave' && livePayments
      ? required('WAVE_API_KEY')
      : process.env.WAVE_API_KEY || '',
  waveBaseUrl: process.env.WAVE_BASE_URL || 'https://api.wave.com',
  waveSigningSecret: process.env.WAVE_SIGNING_SECRET || '',
  waveWebhookSecret:
    paymentProvider === 'wave' && livePayments
      ? required('WAVE_WEBHOOK_SECRET')
      : process.env.WAVE_WEBHOOK_SECRET || devWebhookSecret,
  waveCurrency: process.env.WAVE_CURRENCY || 'XOF',
  // Emails (SMTP) — désactivé tant que MAIL_ENABLED !== 'true'
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || '',
  mailEnabled: process.env.MAIL_ENABLED === 'true',
};