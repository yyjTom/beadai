import { NextResponse } from 'next/server';
import { adminBadRequest, adminUnavailable, requireAdminSession } from '@/lib/admin';
import { findUserByEmail, isValidEmail } from '@/lib/auth/account';
import { getDb } from '@/lib/db';
import { patternUnlocks } from '@/lib/db/schema';
import { newId } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATTERN_HASH = /^[a-f0-9]{64}$/;

/** Manually records a single-pattern unlock, e.g. to recover a lost webhook. */
export const POST = async (request: Request) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const db = getDb();
  if (!db) return adminUnavailable();

  let body: { email?: string; patternHash?: string };
  try {
    body = (await request.json()) as { email?: string; patternHash?: string };
  } catch {
    return adminBadRequest('invalid_json');
  }

  const patternHash = (body.patternHash ?? '').trim().toLowerCase();

  if (!isValidEmail(body.email ?? '')) return adminBadRequest('valid_email_required');
  if (!PATTERN_HASH.test(patternHash)) return adminBadRequest('pattern_hash_must_be_64_hex');

  const user = await findUserByEmail(body.email as string);
  if (!user) return adminBadRequest('user_not_found');

  const inserted = await db
    .insert(patternUnlocks)
    .values({
      id: newId(),
      userId: user.id,
      patternHash,
      provider: 'admin',
      providerPaymentId: `admin-${newId()}`,
    })
    .onConflictDoNothing()
    .returning({ id: patternUnlocks.id });

  return NextResponse.json(
    inserted.length > 0
      ? { granted: true }
      : { granted: false, reason: 'already_unlocked' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
