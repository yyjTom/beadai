import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { adminBadRequest, adminUnavailable, requireAdminSession } from '@/lib/admin';
import { findUserByEmail, isValidEmail } from '@/lib/auth/account';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Revokes only admin-granted rows. Dodo rows are left alone: marking them
 * cancelled locally would desync from the provider, which keeps renewing and
 * re-activating them on the next webhook.
 */
export const POST = async (request: Request) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const db = getDb();
  if (!db) return adminUnavailable();

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return adminBadRequest('invalid_json');
  }

  if (!isValidEmail(body.email ?? '')) return adminBadRequest('valid_email_required');

  const user = await findUserByEmail(body.email as string);
  if (!user) return adminBadRequest('user_not_found');

  const revoked = await db
    .update(subscriptions)
    .set({ status: 'cancelled', canceledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.provider, 'admin'),
        inArray(subscriptions.status, ['active', 'renewed', 'trialing']),
      ),
    )
    .returning({ id: subscriptions.id });

  return NextResponse.json(
    { revoked: revoked.length },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
