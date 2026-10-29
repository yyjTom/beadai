import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { env, integrationStatus } from '@/lib/env';
import { readUsage } from '@/lib/quota/aiQuota';
import { FREE_MAX_GRID, PRO_MAX_GRID, GUEST_DAILY_AI_LIMIT } from '@/lib/plan';
import type { EntitlementStatus } from '@/types/entitlement';

export { FREE_MAX_GRID, PRO_MAX_GRID };

export interface ResolveInput {
  userId: string | null;
  anonKey: string | null;
  ipKey: string | null;
}

const ACTIVE_STATUSES = ['active', 'renewed', 'trialing'];

export const resolveSubscription = async (
  userId: string,
): Promise<{ plan: 'pro'; renewsAt: string | null } | null> => {
  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.provider, 'dodo'),
        or(
          ...ACTIVE_STATUSES.map((status) => eq(subscriptions.status, status)),
          and(isNull(subscriptions.canceledAt), gt(subscriptions.currentPeriodEnd, new Date())),
        ),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (!ACTIVE_STATUSES.includes(row.status) && row.currentPeriodEnd === null) return null;

  return {
    plan: 'pro',
    renewsAt: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
  };
};

export const resolveEntitlement = async (input: ResolveInput): Promise<EntitlementStatus> => {
  const integrations = integrationStatus();

  const subscription = input.userId ? await resolveSubscription(input.userId) : null;
  const isPro = Boolean(subscription);

  const subjects = [
    input.userId ? `user:${input.userId}` : null,
    input.anonKey,
    input.ipKey,
  ].filter((value): value is string => Boolean(value));

  const used = subjects.length > 0 ? Math.max(...(await Promise.all(subjects.map(readUsage))), 0) : 0;
  const remaining = isPro ? null : Math.max(0, GUEST_DAILY_AI_LIMIT - used);

  return {
    signedIn: Boolean(input.userId),
    email: null,
    plan: isPro ? 'pro' : 'free',
    active: isPro,
    aiRemaining: isPro ? null : remaining,
    aiUnlimited: isPro,
    canExportPdf: isPro,
    maxGrid: isPro ? PRO_MAX_GRID : FREE_MAX_GRID,
    renewsAt: subscription?.renewsAt ?? null,
    source: isPro ? 'subscription' : input.userId ? 'user' : 'anonymous',
    integrations,
  };
};

export const isProActive = (status: EntitlementStatus | null): boolean =>
  Boolean(status && status.plan === 'pro' && status.active);
