import { NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { adminBadRequest, adminUnavailable, requireAdminSession } from '@/lib/admin';
import { findUserByEmail, isValidEmail } from '@/lib/auth/account';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { resolveSubscription } from '@/lib/entitlement/entitlement';
import { newId } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Duration = '1m' | '12m' | 'lifetime';

const DURATION_DAYS: Record<Exclude<Duration, 'lifetime'>, number> = {
  '1m': 31,
  '12m': 366,
};

/**
 * Grants Pro by writing an `admin`-provider subscription row. The entitlement
 * resolver treats any active row as Pro, so this needs no schema change.
 *
 * The grant is idempotent: a user keeps exactly one active admin row. Re-grant
 * updates that row (e.g. 1m → lifetime) and any stray duplicates left over from
 * earlier versions are cancelled, so the ledger stays readable.
 * Dodo-managed subscriptions are never touched — cancelling those happens in
 * the Dodo dashboard.
 */
export const POST = async (request: Request) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const db = getDb();
  if (!db) return adminUnavailable();

  let body: { email?: string; duration?: string };
  try {
    body = (await request.json()) as { email?: string; duration?: string };
  } catch {
    return adminBadRequest('invalid_json');
  }

  const email = body.email ?? '';
  const duration = body.duration as Duration | undefined;

  if (!isValidEmail(email)) return adminBadRequest('valid_email_required');
  if (duration !== '1m' && duration !== '12m' && duration !== 'lifetime') {
    return adminBadRequest('duration_must_be_1m_12m_or_lifetime');
  }

  const user = await findUserByEmail(email);
  if (!user) return adminBadRequest('user_not_found');

  const currentPeriodEnd =
    duration === 'lifetime' ? null : new Date(Date.now() + DURATION_DAYS[duration] * 86_400_000);

  const activeRows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.provider, 'admin'),
        inArray(subscriptions.status, ['active', 'renewed', 'trialing']),
      ),
    )
    .orderBy(desc(subscriptions.createdAt));

  let mode: 'created' | 'updated';
  if (activeRows.length === 0) {
    await db.insert(subscriptions).values({
      id: newId(),
      userId: user.id,
      provider: 'admin',
      providerSubscriptionId: `admin-${newId()}`,
      status: 'active',
      planKey: `admin-${duration}`,
      currentPeriodEnd,
      canceledAt: null,
    });
    mode = 'created';
  } else {
    await db
      .update(subscriptions)
      .set({
        planKey: `admin-${duration}`,
        currentPeriodEnd,
        canceledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, activeRows[0].id));

    if (activeRows.length > 1) {
      await db
        .update(subscriptions)
        .set({ status: 'cancelled', canceledAt: new Date(), updatedAt: new Date() })
        .where(inArray(subscriptions.id, activeRows.slice(1).map((row) => row.id)));
    }
    mode = 'updated';
  }

  // Re-read through the real resolver so the UI reflects what the user gets.
  const entitlement = await resolveSubscription(user.id);

  return NextResponse.json(
    {
      granted: true,
      mode,
      duration,
      proNow: Boolean(entitlement),
      renewsAt: entitlement?.renewsAt ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
