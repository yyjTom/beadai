import { NextResponse } from 'next/server';
import { desc, eq, ilike, sql } from 'drizzle-orm';
import { adminUnavailable, requireAdminSession } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { dailyAiUsage, subscriptions, users } from '@/lib/db/schema';
import { utcDayKey } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * Paginated account directory with search. `pro` is computed the same way the
 * entitlement resolver does (any active subscription row, any provider), and
 * `aiToday` reads today's Postgres counter — the Redis counter may be ahead of
 * it until the Redis key expires or the DB fallback kicks in.
 */
export const GET = async (request: Request) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const db = getDb();
  if (!db) return adminUnavailable();

  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const search = (url.searchParams.get('q') ?? '').trim().toLowerCase().slice(0, 80);

  const where = search
    ? ilike(users.emailNormalized, `%${escapeLike(search)}%`)
    : undefined;

  const [totalRow, rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    db
      .select({
        id: users.id,
        email: users.emailDisplay,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        pro: sql<boolean>`coalesce(bool_or(${subscriptions.status} in ('active', 'renewed', 'trialing')), false)`,
        aiToday: sql<number>`coalesce(max(${dailyAiUsage.count}::int), 0)::int`,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .leftJoin(
        dailyAiUsage,
        sql`${dailyAiUsage.subjectKey} = 'user:' || ${users.id} and ${dailyAiUsage.dayKey} = ${utcDayKey()}`,
      )
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  return NextResponse.json(
    {
      users: rows,
      total: totalRow[0]?.total ?? 0,
      page,
      pageSize: PAGE_SIZE,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
