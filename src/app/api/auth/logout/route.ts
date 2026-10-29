import { NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async () => {
  await revokeSession();
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
};
