import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { isKnownPlan, createCheckout, planProductId } from '@/lib/entitlement/dodo';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  plan: z.string().min(1),
});

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: 'invalid_request', message: 'Choose a plan to continue.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (!isKnownPlan(parsed.data.plan)) {
    return NextResponse.json(
      { ok: false, code: 'unknown_plan', message: 'That plan is not available yet.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const productId = planProductId(parsed.data.plan);
  if (!env.dodoApiKey || !productId) {
    return NextResponse.json(
      {
        ok: false,
        code: 'not_configured',
        message: 'Subscription checkout is not configured on this deployment yet.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        code: 'unauthorized',
        message: 'Sign in first so the subscription stays attached to your account.',
      },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const checkout = await createCheckout({
      productId,
      email: session.email,
      userId: session.userId,
      planKey: parsed.data.plan,
      returnPath: '/account?checkout=return',
    });

    return NextResponse.json(
      { ok: true, checkoutUrl: checkout.checkoutUrl },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[checkout] could not start checkout', error);
    return NextResponse.json(
      { ok: false, code: 'checkout_failed', message: 'We could not start checkout. Try again.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
};
