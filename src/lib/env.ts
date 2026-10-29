const isPositiveInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
};

const read = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  vercelEnv: process.env.VERCEL_ENV ?? null,
  vercelUrl: process.env.VERCEL_URL ?? null,

  siteUrl: read(process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://beadai.app',
  supportEmail: read(process.env.SUPPORT_EMAIL) ?? 'support@beadai.app',

  sessionSecret: read(process.env.SESSION_SECRET),
  databaseUrl: read(process.env.DATABASE_URL),

  googleClientId: read(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: read(process.env.GOOGLE_CLIENT_SECRET),

  resendApiKey: read(process.env.RESEND_API_KEY),
  emailFrom: read(process.env.EMAIL_FROM) ?? 'beadai <no-reply@beadai.app>',
  magicLinkTtlMinutes: isPositiveInt(process.env.MAGIC_LINK_TTL_MINUTES) ?? 15,

  togetherApiKey: read(process.env.TOGETHER_API_KEY),
  togetherModel: read(process.env.TOGETHER_IMAGE_MODEL) ?? 'black-forest-labs/FLUX.1-schnell-Free',
  togetherTimeoutMs: isPositiveInt(process.env.TOGETHER_TIMEOUT_MS) ?? 45_000,
  togetherMaxOutputBytes: isPositiveInt(process.env.TOGETHER_MAX_OUTPUT_BYTES) ?? 6 * 1024 * 1024,
  aiMaxDurationSeconds: isPositiveInt(process.env.AI_ROUTE_MAX_DURATION_SECONDS) ?? 60,

  upstashUrl: read(process.env.UPSTASH_REDIS_REST_URL),
  upstashToken: read(process.env.UPSTASH_REDIS_REST_TOKEN),

  guestDailyAiLimit: isPositiveInt(process.env.GUEST_DAILY_AI_LIMIT) ?? 3,

  dodoApiKey: read(process.env.DODO_PAYMENTS_API_KEY),
  dodoWebhookKey: read(process.env.DODO_PAYMENTS_WEBHOOK_KEY),
  dodoEnv: (read(process.env.DODO_PAYMENTS_ENV) ?? 'test').toLowerCase(),
  dodoProMonthlyProductId: read(process.env.DODO_PRO_MONTHLY_PRODUCT_ID),
  dodoProYearlyProductId: read(process.env.DODO_PRO_YEARLY_PRODUCT_ID),
  dodoProLifetimeProductId: read(process.env.DODO_PRO_LIFETIME_PRODUCT_ID),
  dodoSingleUnlockProductId: read(process.env.DODO_SINGLE_UNLOCK_PRODUCT_ID),

  affiliateTag: read(process.env.AMAZON_ASSOCIATES_TAG),
  affiliateBaseUrl:
    read(process.env.AFFILIATE_BASE_URL) ?? 'https://www.amazon.com/s?k=perler+beads+{code}',
};

export type IntegrationKey =
  | 'database'
  | 'auth'
  | 'google'
  | 'email'
  | 'ai'
  | 'quota'
  | 'payments'
  | 'affiliate';

const liveMode = () => env.dodoEnv === 'live' || env.dodoEnv === 'live_mode';

export const integrationStatus = (): Record<IntegrationKey, boolean> => ({
  database: Boolean(env.databaseUrl),
  auth: Boolean(env.sessionSecret && env.databaseUrl),
  google: Boolean(env.googleClientId && env.googleClientSecret),
  email: Boolean(env.resendApiKey),
  ai: Boolean(env.togetherApiKey),
  quota: Boolean(env.upstashUrl && env.upstashToken),
  payments: Boolean(env.dodoApiKey && env.dodoWebhookKey),
  affiliate: Boolean(env.affiliateTag),
});

export const isIntegrationEnabled = (key: IntegrationKey): boolean => integrationStatus()[key];

export const dodoBaseUrl = (): string =>
  liveMode() ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

export const isDodoLive = (): boolean => liveMode();

export const canonicalUrl = (path = '/'): string => {
  const base = env.siteUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const isProductionHost = (host: string | null): boolean => {
  if (!host) return false;
  const cleaned = host.toLowerCase();
  return cleaned === 'beadai.app' || cleaned === 'www.beadai.app';
};

export const isLocalRequestHost = (host: string | null): boolean => {
  if (!host) return false;
  const cleaned = host.toLowerCase().split(':')[0];
  return cleaned === 'localhost' || cleaned === '127.0.0.1' || cleaned === '[::1]';
};
