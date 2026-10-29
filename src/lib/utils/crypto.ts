import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const newId = (): string => randomUUID();

export const sha256Hex = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

export const hmacHex = (secret: string, value: string): string =>
  createHmac('sha256', secret).update(value, 'utf8').digest('hex');

export const constantTimeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
};

export const hashForLog = (value: string | null): string | null =>
  value ? sha256Hex(value).slice(0, 12) : null;
