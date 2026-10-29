import { incrWithTtl, readCounter, redisKey } from '@/lib/redis';

export const HOUR_SECONDS = 60 * 60;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const hourBucket = (): string => Math.floor(Date.now() / 3_600_000).toString();

/**
 * Rate limit storage is best-effort: if Redis is unreachable the request is
 * logged and allowed, so a cache outage never becomes a login outage.
 */
export const rateLimit = async (input: {
  action: string;
  subject: string;
  limit: number;
  ttlSeconds?: number;
}): Promise<RateLimitResult> => {
  const ttl = input.ttlSeconds ?? HOUR_SECONDS;
  const key = redisKey('rl', input.action, input.subject, hourBucket());

  const count = await incrWithTtl(key, ttl);

  if (count === null) {
    console.error('[rate-limit] storage unavailable; allowing request', input.action);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: count <= input.limit,
    retryAfterSeconds: count > input.limit ? ttl : 0,
  };
};

export const rateLimitPeek = async (action: string, subject: string): Promise<number> => {
  return readCounter(redisKey('rl', action, subject, hourBucket()));
};
