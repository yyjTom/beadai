import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscriptions, webhookEvents } from '@/lib/db/schema';
import { isFreshTimestamp, verifyDodoSignature } from '@/lib/entitlement/dodo';
import { newId } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DodoEvent {
  type?: string;
  data?: {
    metadata?: { user_id?: string; plan_key?: string };
    subscription_id?: string;
    subscription_ids?: string[];
    status?: string;
    next_billing_date?: string;
    canceled_at?: string;
    current_period_end?: string;
    payment_id?: string;
  };
}

const ACTIVE_STATUSES = new Set(['active', 'renewed', 'trialing', 'on_hold', 'paused', 'past_due']);

const mapStatus = (eventType: string, payloadStatus?: string): string => {
  if (payloadStatus) {
    const normalized = payloadStatus.toLowerCase();
    if (['on_hold', 'paused', 'past_due', 'failed'].includes(normalized)) return 'past_due';
    return normalized;
  }

  if (eventType.includes('cancelled') || eventType.includes('expired')) return 'cancelled';
  if (eventType.includes('renewed')) return 'active';
  if (eventType.includes('active')) return 'active';
  return 'unknown';
};

const fallbackPeriodEnd = (status: string): Date => {
  const days = ACTIVE_STATUSES.has(status) ? 31 : 0;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const claimEvent = async (eventId: string, eventType: string): Promise<boolean> => {
  const db = getDb();
  if (!db) return false;

  const inserted = await db
    .insert(webhookEvents)
    .values({ id: newId(), eventId, provider: 'dodo', eventType, receivedAt: new Date() })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });

  return inserted.length > 0;
};

const markEvent = async (eventId: string, eventType: string, result: string): Promise<void> => {
  const db = getDb();
  if (!db) return;

  try {
    await db
      .update(webhookEvents)
      .set({ processedAt: new Date(), result })
      .where(and(eq(webhookEvents.provider, 'dodo'), eq(webhookEvents.eventId, eventId)));
  } catch (error) {
    console.error('[dodo-webhook] could not mark event', error);
  }
};

const upsertSubscription = async (input: {
  userId: string;
  planKey: string;
  subscriptionId: string;
  status: string;
  periodEnd: Date | null;
  canceledAt: Date | null;
}): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('database_unavailable');

  await db
    .insert(subscriptions)
    .values({
      id: newId(),
      userId: input.userId,
      provider: 'dodo',
      providerSubscriptionId: input.subscriptionId,
      status: input.status,
      planKey: input.planKey,
      currentPeriodEnd: input.periodEnd,
      canceledAt: input.canceledAt,
    })
    .onConflictDoUpdate({
      target: [subscriptions.provider, subscriptions.providerSubscriptionId],
      set: {
        status: input.status,
        planKey: input.planKey,
        currentPeriodEnd: input.periodEnd,
        canceledAt: input.canceledAt,
        updatedAt: new Date(),
      },
    });
};

const ignore = (reason: string) =>
  NextResponse.json({ ignored: true, reason }, { status: 200, headers: { 'Cache-Control': 'no-store' } });

export const POST = async (request: Request) => {
  const rawBody = await request.text();

  const webhookId = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signature = request.headers.get('webhook-signature');

  if (!isFreshTimestamp(timestamp)) {
    console.error('[dodo-webhook] stale or missing timestamp');
    return NextResponse.json({ error: 'stale_timestamp' }, { status: 401 });
  }

  if (!verifyDodoSignature({ rawBody, webhookId, timestamp, signatureHeader: signature })) {
    console.error('[dodo-webhook] signature verification failed');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let event: DodoEvent;
  try {
    event = JSON.parse(rawBody) as DodoEvent;
  } catch (error) {
    console.error('[dodo-webhook] invalid payload', error);
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const eventType = event.type ?? 'unknown';
  const eventId = webhookId ?? `${eventType}:${event.data?.payment_id ?? newId()}`;

  const claimed = await claimEvent(eventId, eventType);
  if (!claimed) {
    return ignore('duplicate_event');
  }

  const userId = event.data?.metadata?.user_id;
  const planKey = event.data?.metadata?.plan_key ?? 'pro-monthly';
  const subscriptionId = event.data?.subscription_id ?? event.data?.subscription_ids?.[0] ?? null;

  if (!userId) {
    await markEvent(eventId, eventType, 'ignored_missing_user');
    return ignore('missing_user_metadata');
  }

  if (eventType.startsWith('payment.')) {
    // One-time packs are not part of this product; subscriptions only update state.
    await markEvent(eventId, eventType, 'ignored_payment');
    return ignore('payment_event_no_ledger');
  }

  if (!eventType.startsWith('subscription.') || !subscriptionId) {
    await markEvent(eventId, eventType, 'ignored_unsupported');
    return ignore('unsupported_event');
  }

  const status = mapStatus(eventType, event.data?.status);
  const periodEnd =
    parseDate(event.data?.next_billing_date) ??
    parseDate(event.data?.current_period_end) ??
    fallbackPeriodEnd(status);
  const canceledAt = parseDate(event.data?.canceled_at);

  try {
    await upsertSubscription({ userId, planKey, subscriptionId, status, periodEnd, canceledAt });
    await markEvent(eventId, eventType, 'processed');
    return NextResponse.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[dodo-webhook] processing failed', error);
    await markEvent(eventId, eventType, 'failed');
    return NextResponse.json(
      { error: 'processing_failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
};
