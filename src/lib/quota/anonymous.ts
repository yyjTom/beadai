import { cookies } from 'next/headers';
import { readAnonId } from '@/lib/auth/session';
import { env } from '@/lib/env';
import { hashForLog } from '@/lib/utils/crypto';

export const ANON_COOKIE = 'beadai_anon';

export const clientIp = (request: Request): string | null => {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
};

export const ipKey = (request: Request): string | null => {
  const hash = hashForLog(clientIp(request));
  return hash ? `ip:${hash}` : null;
};

/**
 * Reads the signed anonymous id. The signature is checked here on purpose:
 * trusting the raw cookie would let anyone mint a fresh quota identity.
 */
export const anonKey = async (): Promise<string | null> => {
  const value = await readAnonId();
  return value ? `anon:${value}` : null;
};

export const guestDailyLimit = (): number => env.guestDailyAiLimit;
