import { createHmac, timingSafeEqual } from 'node:crypto';
import { dodoBaseUrl, env } from '@/lib/env';

export interface DodoCheckoutInput {
  productId: string;
  email: string;
  userId: string;
  planKey: string;
  returnPath: string;
}

export interface DodoCheckoutResult {
  checkoutUrl: string;
  sessionId: string | null;
}

export const createCheckout = async (input: DodoCheckoutInput): Promise<DodoCheckoutResult> => {
  const base = dodoBaseUrl();
  if (!base || !env.dodoApiKey) throw new Error('payments_not_configured');

  const response = await fetch(`${base}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.dodoApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: { email: input.email },
      return_url: `${env.siteUrl.replace(/\/+$/, '')}${input.returnPath}`,
      metadata: {
        user_id: input.userId,
        plan_key: input.planKey,
      },
    }),
  });

  if (!response.ok) {
    console.error('[dodo] checkout creation failed', response.status);
    throw new Error('checkout_failed');
  }

  const payload = (await response.json()) as { checkout_url?: string; session_id?: string };
  if (!payload.checkout_url) throw new Error('checkout_failed');

  return { checkoutUrl: payload.checkout_url, sessionId: payload.session_id ?? null };
};

const decodeSecret = (secret: string): Buffer => {
  const trimmed = secret.trim();
  const withoutPrefix = trimmed.startsWith('whsec_') ? trimmed.slice(6) : trimmed;
  return Buffer.from(withoutPrefix, 'base64');
};

export const verifyDodoSignature = (input: {
  rawBody: string;
  webhookId: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
}): boolean => {
  const secret = env.dodoWebhookKey;
  if (!secret || !input.webhookId || !input.timestamp || !input.signatureHeader) return false;

  const signed = `${input.webhookId}.${input.timestamp}.${input.rawBody}`;
  const expected = createHmac('sha256', decodeSecret(secret)).update(signed).digest('base64');

  const candidates = input.signatureHeader
    .split(' ')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('v1,'))
    .map((entry) => entry.slice(3));

  for (const candidate of candidates) {
    const bufferA = Buffer.from(candidate, 'utf8');
    const bufferB = Buffer.from(expected, 'utf8');
    if (bufferA.length !== bufferB.length) continue;
    if (timingSafeEqual(bufferA, bufferB)) return true;
  }

  return false;
};

const TOLERANCE_SECONDS = 300;

export const isFreshTimestamp = (timestamp: string | null): boolean => {
  if (!timestamp) return false;
  const parsed = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(parsed)) return false;
  const drift = Math.abs(Math.floor(Date.now() / 1000) - parsed);
  return drift <= TOLERANCE_SECONDS;
};

export const DODO_PLANS = {
  'pro-monthly': env.dodoProMonthlyProductId,
  'pro-yearly': env.dodoProYearlyProductId,
} as const;

export type DodoPlanKey = keyof typeof DODO_PLANS;

export const isKnownPlan = (value: string): value is DodoPlanKey => value in DODO_PLANS;

export const planProductId = (key: DodoPlanKey): string | null => DODO_PLANS[key] ?? null;
