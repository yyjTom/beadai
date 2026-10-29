import { NextResponse } from 'next/server';
import { claimMagicLink } from '@/lib/auth/magicLink';
import { upsertVerifiedUser } from '@/lib/auth/account';
import { clientIpHash, createSession, userAgentHash } from '@/lib/auth/session';
import { anonKey, ipKey } from '@/lib/quota/anonymous';
import { mergeAnonymousUsage } from '@/lib/quota/aiQuota';
import { safeNextPath } from '@/lib/auth/redirect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const next = safeNextPath(url.searchParams.get('next'));

  const result = await claimMagicLink(token);

  if (!result.ok || !result.email) {
    const target = new URL('/login', request.url);
    target.searchParams.set('magic', result.reason ?? 'invalid');
    return NextResponse.redirect(target);
  }

  try {
    const account = await upsertVerifiedUser({
      email: result.email,
      provider: 'magiclink',
      providerSubject: `magiclink:${result.email}`,
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
    console.error('[magic-claim] session creation failed', error);
    const target = new URL('/login', request.url);
    target.searchParams.set('magic', 'not_configured');
    return NextResponse.redirect(target);
  }
};
