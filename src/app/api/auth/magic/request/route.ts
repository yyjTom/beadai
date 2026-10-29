import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestMagicLink } from '@/lib/auth/magicLink';
import { clientIpHash, userAgentHash } from '@/lib/auth/session';
import { rateLimit } from '@/lib/quota/rateLimit';
import { env, isLocalRequestHost } from '@/lib/env';
import { isEmailConfigured } from '@/lib/email/resend';
import { hashForLog } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS_PER_HOUR = 5;

const bodySchema = z.object({ email: z.string().trim() }).default({ email: '' });

const generic = (retryAfterSeconds = 0) =>
  NextResponse.json(
    {
      ok: true,
      message: 'If that address can receive mail, a single-use sign-in link is on its way.',
      retryAfterSeconds,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );

export const POST = async (request: Request) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const email = parsed.success ? parsed.data.email : '';
  const ipHash = clientIpHash(request);
  const requestHost = request.headers.get('host');
  // A link must never be echoed back in production, even if the host header lies.
  const allowDevEcho =
    env.nodeEnv !== 'production' && isLocalRequestHost(requestHost) && !isEmailConfigured();

  if (!email) {
    return NextResponse.json(
      { ok: false, message: 'Enter an email address first.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const ipLimit = await rateLimit({
    action: 'magic',
    subject: ipHash ?? 'unknown-ip',
    limit: MAX_ATTEMPTS_PER_HOUR,
  });

  if (!ipLimit.allowed) {
    console.error('[magic-request] IP rate limit reached', ipHash);
    return NextResponse.json(
      {
        ok: false,
        message: 'Too many sign-in requests from this network. Try again in an hour.',
      },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const emailLimit = await rateLimit({
    action: 'magic-email',
    subject: hashForLog(email.toLowerCase()) ?? 'unknown',
    limit: MAX_ATTEMPTS_PER_HOUR,
  });

  if (!emailLimit.allowed) {
    return generic(emailLimit.retryAfterSeconds);
  }

  const result = await requestMagicLink({
    email,
    ipHash,
    userAgentHash: userAgentHash(request),
    allowDevEcho,
  });

  if (result.reason === 'invalid_email') {
    return NextResponse.json(
      { ok: false, message: 'That email address does not look right.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (result.reason === 'not_configured' || result.reason === 'email_failed') {
    return NextResponse.json(
      {
        ok: false,
        message:
          result.reason === 'not_configured'
            ? 'Sign-in by email is not configured on this deployment yet.'
            : 'We could not send the sign-in email. Please try again shortly.',
      },
      { status: result.reason === 'not_configured' ? 503 : 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (allowDevEcho && result.devUrl) {
    return NextResponse.json(
      { ok: true, message: 'Local development link issued.', devUrl: result.devUrl },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return generic();
};
