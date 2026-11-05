import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { adminUnavailable, requireAdminSession } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { dailyAiUsage, patternUnlocks, subscriptions, users, webhookEvents } from '@/lib/db/schema';
import { utcDayKey } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Global stats for the admin landing card, plus the recent webhook ledger. */
export const GET = async () => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const db = getDb();
  if (!db) return adminUnavailable();

  const [userStats, subscriptionStats, unlockStats, aiStats, events] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(users),
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`(count(*) filter (where ${subscriptions.status} in ('active', 'renewed', 'trialing')))::int`,
      })
      .from(subscriptions),
    db.select({ total: sql<number>`count(*)::int` }).from(patternUnlocks),
    db
      .select({
        today: sql<number>`coalesce(sum(${dailyAiUsage.count}::int), 0)::int`,
      })
      .from(dailyAiUsage)
      .where(eq(dailyAiUsage.dayKey, utcDayKey())),
    db
      .select({
        eventType: webhookEvents.eventType,
        eventId: webhookEvents.eventId,
        receivedAt: webhookEvents.receivedAt,
        processedAt: webhookEvents.processedAt,
        result: webhookEvents.result,
      })
      .from(webhookEvents)
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(20),
  ]);

  return NextResponse.json(
    {
      users: userStats[0]?.total ?? 0,
      subscriptions: subscriptionStats[0] ?? { total: 0, active: 0 },
      unlocks: unlockStats[0]?.total ?? 0,
      aiGenerationsToday: aiStats[0]?.today ?? 0,
      webhookEvents: events,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
