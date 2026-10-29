import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { resolveEntitlement } from '@/lib/entitlement/entitlement';
import { clientIpHash } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  const session = await readSession();
  const entitlement = await resolveEntitlement({
    userId: session?.userId ?? null,
    anonKey: null,
    ipKey: clientIpHash(request),
  });

  return NextResponse.json(
    {
      signedIn: Boolean(session),
      user: session ? { id: session.userId, email: session.email, plan: entitlement.plan } : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
