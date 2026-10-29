import { cookies } from 'next/headers';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { newId, randomToken, sha256Hex, hashForLog } from '@/lib/utils/crypto';

export const SESSION_COOKIE = 'beadai_session';
export const ANON_COOKIE = 'beadai_anon';

const SESSION_TTL_DAYS = 14;
const ANON_TTL_SECONDS = 60 * 60 * 24 * 30;

const secureCookies = (): boolean => env.nodeEnv === 'production';

export interface SessionRecord {
  userId: string;
  email: string;
}

export const createSession = async (input: {
  userId: string;
  ipHash?: string | null;
  userAgentHash?: string | null;
}): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Sessions require DATABASE_URL to be configured.');

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: newId(),
    userId: input.userId,
    tokenHash,
    expiresAt,
    ipHash: input.ipHash ?? null,
    userAgentHash: input.userAgentHash ?? null,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
};

export const readSession = async (): Promise<SessionRecord | null> => {
  const db = getDb();
  if (!db) return null;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = sha256Hex(token);

  const rows = await db
    .select({ userId: sessions.userId, email: users.emailDisplay })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { userId: row.userId, email: row.email };
};

export const revokeSession = async (): Promise<void> => {
  const db = getDb();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  store.delete(SESSION_COOKIE);

  if (!db || !token) return;

  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, sha256Hex(token)));
};

const anonSignature = (value: string): string => {
  const secret = env.sessionSecret ?? 'beadai-dev-anon';
  return sha256Hex(`${secret}:${value}`);
};

export const readAnonId = async (): Promise<string | null> => {
  const store = await cookies();
  const raw = store.get(ANON_COOKIE)?.value;
  if (!raw) return null;

  const [value, signature] = raw.split('.');
  if (!value || !signature) return null;
  if (anonSignature(value) !== signature) return null;

  return value;
};

export const ensureAnonId = async (): Promise<string> => {
  const existing = await readAnonId();
  if (existing) return existing;

  const value = randomToken(18);
  const signed = `${value}.${anonSignature(value)}`;
  const store = await cookies();

  store.set(ANON_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: ANON_TTL_SECONDS,
  });

  return value;
};

export const clientIpHash = (request: Request): string | null => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
  return hashForLog(ip);
};

export const userAgentHash = (request: Request): string | null =>
  hashForLog(request.headers.get('user-agent'));
