import { and, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { magicLoginTokens } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { isValidEmail, normalizeEmail } from '@/lib/auth/account';
import { canonicalUrl } from '@/lib/env';
import { newId, randomToken, sha256Hex } from '@/lib/utils/crypto';

export type MagicLinkReason =
  | 'invalid_email'
  | 'not_configured'
  | 'rate_limited'
  | 'email_failed';

export interface MagicLinkRequestResult {
  ok: boolean;
  reason: MagicLinkReason | null;
  devUrl: string | null;
  retryAfterSeconds: number;
}

export const magicLinkPath = (token: string): string => `/api/auth/magic/claim?token=${token}`;

/**
 * Sends a single-use login link. The response is identical whether or not the
 * mailbox exists, so the endpoint cannot be used to enumerate accounts.
 */
export const requestMagicLink = async (input: {
  email: string;
  ipHash: string | null;
  userAgentHash: string | null;
  allowDevEcho: boolean;
}): Promise<MagicLinkRequestResult> => {
  if (!isValidEmail(input.email)) {
    return { ok: false, reason: 'invalid_email', devUrl: null, retryAfterSeconds: 0 };
  }

  const db = getDb();
  if (!db) {
    return { ok: false, reason: 'not_configured', devUrl: null, retryAfterSeconds: 0 };
  }

  const email = normalizeEmail(input.email);
  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + env.magicLinkTtlMinutes * 60 * 1000);

  await db
    .update(magicLoginTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(magicLoginTokens.emailNormalized, email), isNull(magicLoginTokens.consumedAt)));

  await db.insert(magicLoginTokens).values({
    id: newId(),
    emailNormalized: email,
    tokenHash,
    expiresAt,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
  });

  const url = canonicalUrl(magicLinkPath(token));

  try {
    await sendMagicLinkEmail({
      to: input.email.trim(),
      url,
      expiresInMinutes: env.magicLinkTtlMinutes,
      brandName: 'beadai',
    });

    return { ok: true, reason: null, devUrl: null, retryAfterSeconds: 0 };
  } catch (error) {
    console.error('[magic-link] could not deliver the login email', error);

    if (input.allowDevEcho) {
      console.error('[magic-link] localhost development link', url);
      return { ok: true, reason: null, devUrl: url, retryAfterSeconds: 0 };
    }

    return { ok: false, reason: 'email_failed', devUrl: null, retryAfterSeconds: 0 };
  }
};

export type MagicLinkClaimReason = 'missing_token' | 'invalid' | 'used' | 'expired' | 'not_configured';

export interface MagicLinkClaimResult {
  ok: boolean;
  email: string | null;
  reason: MagicLinkClaimReason | null;
}

/**
 * Burns the ticket atomically before any state change so a replayed or
 * double-clicked link can never create two sessions.
 */
export const claimMagicLink = async (token: string): Promise<MagicLinkClaimResult> => {
  if (!token) return { ok: false, email: null, reason: 'missing_token' };

  const db = getDb();
  if (!db) return { ok: false, email: null, reason: 'not_configured' };

  const tokenHash = sha256Hex(token);

  const existing = await db
    .select({ id: magicLoginTokens.id, email: magicLoginTokens.emailNormalized })
    .from(magicLoginTokens)
    .where(eq(magicLoginTokens.tokenHash, tokenHash))
    .limit(1);

  const row = existing[0];
  if (!row) return { ok: false, email: null, reason: 'invalid' };

  const consumed = await db
    .update(magicLoginTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(magicLoginTokens.id, row.id), isNull(magicLoginTokens.consumedAt)))
    .returning({ id: magicLoginTokens.id, expiresAt: magicLoginTokens.expiresAt });

  if (consumed.length === 0) return { ok: false, email: null, reason: 'used' };

  if (consumed[0].expiresAt.getTime() < Date.now()) {
    return { ok: false, email: null, reason: 'expired' };
  }

  return { ok: true, email: row.email, reason: null };
};

export const purgeExpiredMagicLinks = async (): Promise<void> => {
  const db = getDb();
  if (!db) return;

  await db
    .delete(magicLoginTokens)
    .where(sql`${magicLoginTokens.expiresAt} < now() - interval '7 days'`);
};
