import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { authIdentities, users } from '@/lib/db/schema';
import { newId } from '@/lib/utils/crypto';

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(normalizeEmail(value));

export interface AccountRecord {
  id: string;
  email: string;
}

export const findUserByEmail = async (email: string): Promise<AccountRecord | null> => {
  const db = getDb();
  if (!db) return null;

  const normalized = normalizeEmail(email);
  const rows = await db
    .select({ id: users.id, email: users.emailDisplay })
    .from(users)
    .where(eq(users.emailNormalized, normalized))
    .limit(1);

  return rows[0] ?? null;
};

export const linkIdentity = async (input: {
  userId: string;
  provider: 'google' | 'magiclink';
  providerSubject: string;
}): Promise<void> => {
  const db = getDb();
  if (!db) return;

  const existing = await db
    .select({ id: authIdentities.id })
    .from(authIdentities)
    .where(eq(authIdentities.providerSubject, input.providerSubject))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(authIdentities).values({
    id: newId(),
    userId: input.userId,
    provider: input.provider,
    providerSubject: input.providerSubject,
  });
};

/**
 * Email is the merge key: Google sign-in and magic-link sign-in converge on the
 * same user row so a subscription always follows the mailbox.
 */
export const upsertVerifiedUser = async (input: {
  email: string;
  provider: 'google' | 'magiclink';
  providerSubject: string;
}): Promise<AccountRecord> => {
  const db = getDb();
  if (!db) throw new Error('Accounts require DATABASE_URL to be configured.');

  const normalized = normalizeEmail(input.email);
  const existing = await findUserByEmail(normalized);

  if (existing) {
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), lastLoginAt: new Date() })
      .where(eq(users.id, existing.id));
    await linkIdentity({
      userId: existing.id,
      provider: input.provider,
      providerSubject: input.providerSubject,
    });
    return existing;
  }

  const id = newId();
  await db.insert(users).values({
    id,
    emailNormalized: normalized,
    emailDisplay: input.email.trim(),
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
  });

  await linkIdentity({ userId: id, provider: input.provider, providerSubject: input.providerSubject });

  return { id, email: input.email.trim() };
};
