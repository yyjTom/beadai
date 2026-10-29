'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubscribeButton } from '@/components/auth/SubscribeButton';

export const EntitlementCard = ({
  signedIn,
  plan,
  remaining,
  unlimited,
  maxGrid,
}: {
  signedIn: boolean;
  plan: 'free' | 'pro';
  remaining: number | null;
  unlimited: boolean;
  maxGrid: number;
}) => (
  <div className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-soft">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-ink">Your access</p>
      {plan === 'pro' ? (
        <Badge variant="violet">Pro</Badge>
      ) : (
        <Badge variant="neutral">Free</Badge>
      )}
    </div>

    <p className="mt-3 flex items-center gap-2 text-sm text-ink">
      <Sparkles className="h-4 w-4 text-bead-violet" />
      {unlimited
        ? 'Unlimited AI generations'
        : remaining === null
          ? 'AI generation unavailable'
          : `${remaining} free AI generations left today`}
    </p>

    <p className="mt-2 text-sm text-ink-muted">Largest board: {maxGrid} × {maxGrid}</p>

    <div className="mt-5">
      {plan === 'pro' ? (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/account">Manage subscription</Link>
        </Button>
      ) : (
        <SubscribeButton plan="pro-monthly" next="/studio" size="sm" variant="gradient">
          Upgrade to Pro
        </SubscribeButton>
      )}
    </div>

    {!signedIn ? (
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Signing in keeps Pro access and your daily allowance with you on any device.
      </p>
    ) : null}
  </div>
);
