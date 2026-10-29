import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode, fetchGoogleProfile, googleRedirectUri } from '@/lib/auth/google';
import { safeNextPath } from '@/lib/auth/redirect';
import { upsertVerifiedUser } from '@/lib/auth/account';
import { clientIpHash, createSession, userAgentHash } from '@/lib/auth/session';
import { OAUTH_STATE_COOKIE } from '@/lib/auth/constants';
import { anonKey, ipKey } from '@/lib/quota/anonymous';
import { mergeAnonymousUsage } from '@/lib/quota/aiQuota';
import { constantTimeEqual } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = OAUTH_STATE_COOKIE;

const fail = (request: Request, reason: string, next: string) => {
  const url = new URL('/login', request.url);
  url.searchParams.set('google', reason);
  url.searchParams.set('next', next);
  return NextResponse.redirect(url);
};

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const store = await cookies();
  const rawState = store.get(STATE_COOKIE)?.value;
  const fallbackNext = safeNextPath(url.searchParams.get('state'));

  store.delete(STATE_COOKIE);

  if (!rawState) return fail(request, 'state_missing', fallbackNext);

  let savedState = '';
  let next = fallbackNext;

  try {
    const parsed = JSON.parse(rawState) as { s?: string; n?: string };
    savedState = parsed.s ?? '';
    next = safeNextPath(parsed.n ?? fallbackNext);
  } catch {
    return fail(request, 'state_missing', fallbackNext);
  }

  const queryState = url.searchParams.get('state') ?? '';
  if (!constantTimeEqual(savedState, queryState)) {
    return fail(request, 'state_mismatch', next);
  }

  if (url.searchParams.get('error')) return fail(request, 'denied', next);

  const code = url.searchParams.get('code');
  if (!code) return fail(request, 'no_code', next);

  try {
    const accessToken = await exchangeGoogleCode(code, googleRedirectUri());
    const profile = await fetchGoogleProfile(accessToken);

    if (!profile.emailVerified) return fail(request, 'unverified_email', next);

    const account = await upsertVerifiedUser({
      email: profile.email,
      provider: 'google',
      providerSubject: profile.subject,
    });

    await createSession({
      userId: account.id,
      ipHash: clientIpHash(request),
      userAgentHash: userAgentHash(request),
    });

    await mergeAnonymousUsage({
      userId: account.id,
      anonKey: await anonKey(),
      ipKey: ipKey(request),
    });

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error('[google-callback] sign-in failed', error);
    // Fixed reason only: the real message can carry tokens and upstream URLs.
    return fail(request, 'signin_failed', next);
  }
};
