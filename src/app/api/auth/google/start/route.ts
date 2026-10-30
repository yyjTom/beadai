import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl, googleRedirectUri } from '@/lib/auth/google';
import { safeNextPath } from '@/lib/auth/redirect';
import { OAUTH_STATE_COOKIE } from '@/lib/auth/constants';
import { env } from '@/lib/env';
import { randomToken } from '@/lib/utils/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = OAUTH_STATE_COOKIE;

export const GET = async (request: Request) => {
  const next = safeNextPath(new URL(request.url).searchParams.get('next'));

  if (!env.googleClientId || !env.googleClientSecret) {
    return NextResponse.redirect(new URL('/login?google=unconfigured', request.url));
  }

  const state = randomToken(32);
  const store = await cookies();

  store.set(STATE_COOKIE, JSON.stringify({ s: state, n: next }), {
    httpOnly: true,
    // Lax is required: Google navigates back to the callback cross-site, and
    // Strict would withhold the cookie and fail every sign-in.
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
    // 30 minutes. Ten was too tight once account chooser, password and 2FA
    // were added up — an expired cookie reads as "session expired" to the user.
    maxAge: 1800,
  });

  const redirectUri = googleRedirectUri();
  const url = buildGoogleAuthUrl({ state, redirectUri });

  return NextResponse.redirect(url);
};
