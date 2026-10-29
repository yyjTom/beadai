import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { anonKey, ipKey } from '@/lib/quota/anonymous';
import { resolveEntitlement } from '@/lib/entitlement/entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  const session = await readSession();

  const entitlement = await resolveEntitlement({
    userId: session?.userId ?? null,
    anonKey: await anonKey(),
    ipKey: ipKey(request),
  });

  return NextResponse.json(
    { ...entitlement, email: session?.email ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
