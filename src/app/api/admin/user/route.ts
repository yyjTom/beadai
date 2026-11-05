import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import {
  adminBadRequest,
  adminUnavailable,
  normalizeEmail,
  requireAdminSession,
} from '@/lib/admin';
import { isValidEmail } from '@/lib/auth/account';
import { getDb } from '@/lib/db';
import { patternUnlocks, subscriptions, users } from '@/lib/db/schema';
import { resolveSubscription } from '@/lib/entitlement/entitlement';
import { readUsage } from '@/lib/quota/aiQuota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin view of one account: identity, subscription ledger, unlocks, AI usage. */
export const GET = async (request: Request) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const email = new URL(request.url).searchParams.get('email') ?? '';
  if (!isValidEmail(email)) return adminBadRequest('valid_email_required');

  const db = getDb();
  if (!db) return adminUnavailable();

  const rows = await db
    .select({
      id: users.id,
      email: users.emailDisplay,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.emailNormalized, normalizeEmail(email)))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return NextResponse.json(
      { found: false },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const [subscription, subscriptionRows, unlockRows, usedToday] = await Promise.all([
    resolveSubscription(user.id),
    db
      .select({
        provider: subscriptions.provider,
        providerSubscriptionId: subscriptions.providerSubscriptionId,
        status: subscriptions.status,
        planKey: subscriptions.planKey,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        canceledAt: subscriptions.canceledAt,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(10),
    db
      .select({
        patternHash: patternUnlocks.patternHash,
        provider: patternUnlocks.provider,
        createdAt: patternUnlocks.createdAt,
      })
      .from(patternUnlocks)
      .where(eq(patternUnlocks.userId, user.id))
      .orderBy(desc(patternUnlocks.createdAt))
      .limit(20),
    readUsage(`user:${user.id}`),
  ]);

  return NextResponse.json(
    {
      found: true,
      user,
      pro: Boolean(subscription),
      renewsAt: subscription?.renewsAt ?? null,
      aiUsedToday: usedToday,
      subscriptions: subscriptionRows,
      unlocks: unlockRows,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
