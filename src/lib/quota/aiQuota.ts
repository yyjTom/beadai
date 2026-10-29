import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { dailyAiUsage } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { incrWithTtl, readCounter, redisKey, utcDayKey } from '@/lib/redis';
import { newId } from '@/lib/utils/crypto';

const DAY_SECONDS = 60 * 60 * 24;

const dayKey = (): string => utcDayKey();

const secondsUntilUtcMidnight = (): number => {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5),
  );
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
};

export const readUsage = async (subjectKey: string): Promise<number> => {
  const redisValue = await readCounter(redisKey('ai', dayKey(), subjectKey));
  if (redisValue > 0) return redisValue;

  const db = getDb();
  if (!db) return 0;

  const rows = await db
    .select({ count: dailyAiUsage.count })
    .from(dailyAiUsage)
    .where(and(eq(dailyAiUsage.subjectKey, subjectKey), eq(dailyAiUsage.dayKey, dayKey())))
    .limit(1);

  return Number(rows[0]?.count ?? 0);
};

const bumpPostgres = async (subjectKey: string): Promise<number> => {
  const db = getDb();
  if (!db) return 0;

  const key = dayKey();

  await db
    .insert(dailyAiUsage)
    .values({ id: newId(), subjectKey, dayKey: key, count: '0' })
    .onConflictDoNothing();

  const rows = await db
    .update(dailyAiUsage)
    .set({ count: sql`(${dailyAiUsage.count}::int + 1)::text`, updatedAt: new Date() })
    .where(and(eq(dailyAiUsage.subjectKey, subjectKey), eq(dailyAiUsage.dayKey, key)))
    .returning({ count: dailyAiUsage.count });

  return Number(rows[0]?.count ?? 0);
};

export const consumeAiQuota = async (subjectKeys: string[]): Promise<number> => {
  let usage = 0;

  for (const key of subjectKeys) {
    const redisResult = await incrWithTtl(
      redisKey('ai', dayKey(), key),
      secondsUntilUtcMidnight(),
    );
    if (redisResult === null) {
      usage = Math.max(usage, await bumpPostgres(key));
    } else {
      usage = Math.max(usage, redisResult);
    }
  }

  return usage;
};

/**
 * Merges the anonymous counter into the signed-in user counter, adding only the
 * difference so a fresh sign-in never resets the daily allowance.
 */
export const mergeAnonymousUsage = async (input: {
  userId: string;
  anonKey: string | null;
  ipKey: string | null;
}): Promise<void> => {
  const subjects = [input.anonKey, input.ipKey].filter((value): value is string => Boolean(value));
  if (subjects.length === 0) return;

  const anonymousUsage = Math.max(...(await Promise.all(subjects.map(readUsage))), 0);
  if (anonymousUsage <= 0) return;

  const userUsage = await readUsage(`user:${input.userId}`);
  const missing = anonymousUsage - userUsage;
  if (missing <= 0) return;

  const db = getDb();
  const key = dayKey();

  if (db) {
    await db
      .insert(dailyAiUsage)
      .values({
        id: newId(),
        subjectKey: `user:${input.userId}`,
        dayKey: key,
        count: String(anonymousUsage),
      })
      .onConflictDoUpdate({
        target: [dailyAiUsage.subjectKey, dailyAiUsage.dayKey],
        set: { count: String(anonymousUsage), updatedAt: new Date() },
      });
  }

  for (let step = 0; step < missing; step += 1) {
    await incrWithTtl(redisKey('ai', key, `user:${input.userId}`), secondsUntilUtcMidnight());
  }
};

export const guestLimit = (): number => env.guestDailyAiLimit;
