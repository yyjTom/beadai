import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

let client: Redis | null = null;
let warned = false;

export const getRedis = (): Redis | null => {
  if (client) return client;
  if (!env.upstashUrl || !env.upstashToken) {
    if (!warned && process.env.NODE_ENV !== 'production') {
      console.error('[redis] Upstash credentials missing; quota and rate limiting are degraded.');
      warned = true;
    }
    return null;
  }

  client = new Redis({ url: env.upstashUrl, token: env.upstashToken });
  return client;
};

export const isRedisAvailable = (): boolean => getRedis() !== null;

const PREFIX = 'beadai';

export const redisKey = (...parts: string[]): string => [PREFIX, ...parts].join(':');

export const utcDayKey = (now = new Date()): string => now.toISOString().slice(0, 10);

export const incrWithTtl = async (key: string, ttlSeconds: number): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) return null;

  const pipe = redis.pipeline();
  pipe.incr(key);
  pipe.expire(key, ttlSeconds, 'NX');
  const result = (await pipe.exec()) as unknown[];
  return Number(result[0] ?? 0);
};

export const readCounter = async (key: string): Promise<number> => {
  const redis = getRedis();
  if (!redis) return 0;
  const value = await redis.get<number>(key);
  return typeof value === 'number' ? value : 0;
};

const claimed = (result: unknown): boolean => Boolean(result) && result !== null;

export const acquireLock = async (key: string, ttlSeconds: number): Promise<boolean> => {
  const redis = getRedis();
  if (!redis) return true;
  const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds });
  return claimed(result);
};

export const releaseLock = async (key: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(key);
};

export const claimOnce = async (key: string, ttlSeconds: number): Promise<boolean> => {
  const redis = getRedis();
  if (!redis) return false;
  const result = await redis.set(key, Date.now(), { nx: true, ex: ttlSeconds });
  return claimed(result);
};
