import { NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/auth/account';
import { readSession } from '@/lib/auth/session';
import { isAdminEmail } from '@/lib/adminEmails';

export type AdminGuardResult =
  | { ok: true; adminEmail: string }
  | { ok: false; response: NextResponse };

/**
 * Gate for /api/admin/*. Admin access is the pair (valid session, whitelisted
 * email); there is no role column and no shared token, so a leaked admin URL
 * alone grants nothing.
 */
export const requireAdminSession = async (): Promise<AdminGuardResult> => {
  const session = await readSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'sign_in_required' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      ),
    };
  }

  if (!isAdminEmail(session.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'forbidden' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      ),
    };
  }

  return { ok: true, adminEmail: session.email };
};

export const adminForbidden = (): NextResponse =>
  NextResponse.json(
    { error: 'forbidden' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  );

export const adminBadRequest = (message: string): NextResponse =>
  NextResponse.json(
    { error: message },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );

export const adminUnavailable = (): NextResponse =>
  NextResponse.json(
    { error: 'database_unavailable' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );

export { normalizeEmail };
