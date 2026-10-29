import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getImageProvider } from '@/lib/ai/provider';
import { AiProviderError } from '@/lib/ai/together';
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH, checkPromptSafety, normalizePrompt } from '@/lib/ai/safety';
import { clientIpHash, readSession } from '@/lib/auth/session';
import { anonKey, ipKey } from '@/lib/quota/anonymous';
import { consumeAiQuota, readUsage } from '@/lib/quota/aiQuota';
import { rateLimit } from '@/lib/quota/rateLimit';
import { acquireLock, releaseLock, redisKey } from '@/lib/redis';
import { resolveEntitlement } from '@/lib/entitlement/entitlement';
import { env } from '@/lib/env';
import { AI_ERROR_MESSAGES, type AiErrorCode } from '@/types/ai';
import { hashForLog } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({ prompt: z.string().min(1).max(MAX_PROMPT_LENGTH) });

const fail = (code: AiErrorCode, status: number, retryAfterSeconds?: number) =>
  NextResponse.json(
    { code, message: AI_ERROR_MESSAGES[code], retryAfterSeconds },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );

export const POST = async (request: Request) => {
  const provider = getImageProvider();
  if (!provider) return fail('not_configured', 503);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) return fail('missing_prompt', 400);

  const prompt = normalizePrompt(parsed.data.prompt);
  if (prompt.length < MIN_PROMPT_LENGTH) return fail('prompt_too_short', 400);
  if (prompt.length > MAX_PROMPT_LENGTH) return fail('prompt_too_long', 400);

  const safety = checkPromptSafety(prompt);
  if (safety.blocked) {
    return fail('content_blocked', 400);
  }

  const session = await readSession();
  const anon = await anonKey();
  const ip = ipKey(request);

  const entitlement = await resolveEntitlement({
    userId: session?.userId ?? null,
    anonKey: anon,
    ipKey: ip,
  });

  if (!entitlement.aiUnlimited && (entitlement.aiRemaining ?? 0) <= 0) {
    return fail('quota_exceeded', 429);
  }

  const burst = await rateLimit({
    action: 'ai-generate',
    subject: session?.userId ?? anon ?? (ip ?? 'unknown'),
    limit: 6,
    ttlSeconds: 60,
  });

  if (!burst.allowed) {
    return fail('rate_limited', 429, burst.retryAfterSeconds);
  }

  const lockKey = redisKey('lock', 'ai', session?.userId ?? anon ?? (ip ?? 'unknown'));
  const lockTtl = Math.max(10, Math.floor(maxDuration / 2));
  const locked = await acquireLock(lockKey, lockTtl);
  if (!locked) return fail('rate_limited', 429, lockTtl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(5_000, env.togetherTimeoutMs - 5_000));

  try {
    const image = await provider.generate(prompt, { signal: controller.signal });

    const subjects = [
      session?.userId ? `user:${session.userId}` : null,
      anon,
      ip,
    ].filter((value): value is string => Boolean(value));

    await consumeAiQuota(subjects);

    const used = session?.userId
      ? Math.max(...(await Promise.all(subjects.map(readUsage))), 0)
      : 0;

    return NextResponse.json(
      {
        image,
        entitlement: {
          aiRemaining: entitlement.aiUnlimited ? null : Math.max(0, env.guestDailyAiLimit - used),
          aiUnlimited: entitlement.aiUnlimited,
          plan: entitlement.plan,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof AiProviderError) {
      return fail(error.code, error.code === 'rate_limited' ? 429 : 502);
    }

    console.error('[ai-generate] unexpected failure', { ipHash: hashForLog(clientIpHash(request)) });
    return fail('server_error', 500);
  } finally {
    clearTimeout(timeout);
    await releaseLock(lockKey);
  }
};
