import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { hashForLog, randomToken } from '@/lib/utils/crypto';

export const ANON_COOKIE = 'beadai_anon';

export const clientIp = (request: Request): string | null => {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
};

export const ipKey = (request: Request): string | null => {
  const hash = hashForLog(clientIp(request));
  return hash ? `ip:${hash}` : null;
};

export const anonKey = async (): Promise<string | null> => {
  const store = await cookies();
  const value = store.get(ANON_COOKIE)?.value?.split('.')[0];
  return value ? `anon:${value}` : null;
};

export const newAnonId = (): string => randomToken(18);

export const guestDailyLimit = (): number => env.guestDailyAiLimit;
