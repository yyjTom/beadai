import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const RAW_SECRET = 'beadai-test-secret';
const SECRET_HEADER = `whsec_${Buffer.from(RAW_SECRET).toString('base64')}`;

const sign = (webhookId: string, timestamp: string, body: string): string =>
  createHmac('sha256', Buffer.from(RAW_SECRET)).update(`${webhookId}.${timestamp}.${body}`).digest('base64');

const loadDodo = async () => {
  vi.resetModules();
  process.env.DODO_PAYMENTS_WEBHOOK_KEY = SECRET_HEADER;
  process.env.DODO_PRO_MONTHLY_PRODUCT_ID = 'pdt_monthly';
  process.env.DODO_PRO_YEARLY_PRODUCT_ID = 'pdt_yearly';
  process.env.DODO_PRO_LIFETIME_PRODUCT_ID = 'pdt_lifetime';
  process.env.DODO_SINGLE_UNLOCK_PRODUCT_ID = 'pdt_unlock';
  return import('./dodo');
};

describe('verifyDodoSignature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a correctly signed payload', async () => {
    const { verifyDodoSignature } = await loadDodo();
    const body = '{"type":"payment.succeeded"}';
    const webhookId = 'evt_1';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    expect(
      verifyDodoSignature({
        rawBody: body,
        webhookId,
        timestamp,
        signatureHeader: `v1,${sign(webhookId, timestamp, body)}`,
      }),
    ).toBe(true);
  });

  it('rejects a tampered body', async () => {
    const { verifyDodoSignature } = await loadDodo();
    const webhookId = 'evt_2';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(webhookId, timestamp, '{"type":"payment.succeeded"}');

    expect(
      verifyDodoSignature({
        rawBody: '{"type":"payment.succeeded","amount":9999}',
        webhookId,
        timestamp,
        signatureHeader: `v1,${signature}`,
      }),
    ).toBe(false);
  });

  it('rejects a signature made with another secret', async () => {
    const { verifyDodoSignature } = await loadDodo();
    const body = '{}';
    const webhookId = 'evt_3';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const wrong = createHmac('sha256', Buffer.from('another-secret'))
      .update(`${webhookId}.${timestamp}.${body}`)
      .digest('base64');

    expect(
      verifyDodoSignature({
        rawBody: body,
        webhookId,
        timestamp,
        signatureHeader: `v1,${wrong}`,
      }),
    ).toBe(false);
  });

  it('rejects missing headers', async () => {
    const { verifyDodoSignature } = await loadDodo();
    expect(
      verifyDodoSignature({
        rawBody: '{}',
        webhookId: null,
        timestamp: '1',
        signatureHeader: 'v1,abc',
      }),
    ).toBe(false);
  });

  it('rejects a malformed signature header', async () => {
    const { verifyDodoSignature } = await loadDodo();
    const body = '{}';
    const webhookId = 'evt_4';
    const timestamp = Math.floor(Date.now() / 1000).toString();

    expect(
      verifyDodoSignature({
        rawBody: body,
        webhookId,
        timestamp,
        signatureHeader: sign(webhookId, timestamp, body),
      }),
    ).toBe(false);
  });
});

describe('isFreshTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a timestamp inside the tolerance window', async () => {
    const { isFreshTimestamp } = await loadDodo();
    expect(isFreshTimestamp(Math.floor(Date.now() / 1000 - 60).toString())).toBe(true);
  });

  it('rejects a replay older than the tolerance window', async () => {
    const { isFreshTimestamp } = await loadDodo();
    expect(isFreshTimestamp(Math.floor(Date.now() / 1000 - 4000).toString())).toBe(false);
  });

  it('rejects junk input', async () => {
    const { isFreshTimestamp } = await loadDodo();
    expect(isFreshTimestamp(null)).toBe(false);
    expect(isFreshTimestamp('not-a-number')).toBe(false);
  });
});

describe('plan registry', () => {
  it('exposes every plan and flags the one-time ones', async () => {
    const { DODO_PLANS, isKnownPlan, isOneTimePlan, planProductId } = await loadDodo();

    expect(Object.keys(DODO_PLANS)).toEqual([
      'pro-monthly',
      'pro-yearly',
      'pro-lifetime',
      'single-unlock',
    ]);
    expect(isKnownPlan('pro-lifetime')).toBe(true);
    expect(isKnownPlan('something-else')).toBe(false);
    expect(isOneTimePlan('pro-lifetime')).toBe(true);
    expect(isOneTimePlan('single-unlock')).toBe(true);
    expect(isOneTimePlan('pro-monthly')).toBe(false);
    expect(planProductId('single-unlock')).toBe('pdt_unlock');
  });
});
