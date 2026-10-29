'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscribeButton } from '@/components/auth/SubscribeButton';
import { useSession } from '@/hooks/useSession';
import { useEntitlementPolling } from '@/hooks/useEntitlementPolling';
import type { EntitlementStatus } from '@/types/entitlement';

const isPro = (status: EntitlementStatus | null): boolean =>
  Boolean(status?.plan === 'pro' && status.active);

export const AccountPanel = () => {
  const searchParams = useSearchParams();
  const returned = searchParams.get('checkout') === 'return';

  const { session, entitlement, loading, refresh, signOut } = useSession();
  const isActive = useMemo(() => isPro, []);
  const polling = useEntitlementPolling(returned, isActive);

  const status = polling.status ?? entitlement;
  const pro = isPro(status);

  const quotaText = () => {
    if (!status) return 'Loading…';
    if (status.aiUnlimited) return 'Unlimited AI generations';
    if (status.aiRemaining === null) return 'AI generation unavailable';
    return `${status.aiRemaining} of 3 free AI generations left today`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-8 shadow-lift">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Your account</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {loading
                ? 'Checking your session…'
                : session?.signedIn
                  ? session.user?.email
                  : 'You are browsing as a guest.'}
            </p>
          </div>
          {pro ? (
            <Badge variant="violet">Pro active</Badge>
          ) : session?.signedIn ? (
            <Badge variant="neutral">Free plan</Badge>
          ) : (
            <Badge variant="outline">Guest</Badge>
          )}
        </div>

        {returned ? (
          <div className="mt-6 rounded-3xl border border-bead-violet/25 bg-bead-violet/5 p-5">
            {polling.phase === 'checking' ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-bead-violet">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming your payment…
              </p>
            ) : null}

            {polling.phase === 'active' ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-state-success">
                <CheckCircle2 className="h-4 w-4" />
                Pro is active. Unlimited AI, large boards and PDF exports are unlocked.
              </p>
            ) : null}

            {polling.phase === 'delayed' ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink-muted">
                  We have not seen the payment confirmation yet. It usually lands within a minute.
                </p>
                <Button size="sm" variant="outline" onClick={polling.refresh}>
                  <RefreshCw className="h-4 w-4" />
                  Check again
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-cream-soft/70 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              AI generations
            </dt>
            <dd className="mt-2 flex items-center gap-2 text-lg font-bold text-ink">
              <Sparkles className="h-5 w-5 text-bead-violet" />
              {quotaText()}
            </dd>
          </div>

          <div className="rounded-3xl bg-cream-soft/70 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Pattern export
            </dt>
            <dd className="mt-2 text-lg font-bold text-ink">
              {pro ? 'PDF charts unlocked' : 'PDF charts locked'}
            </dd>
          </div>

          <div className="rounded-3xl bg-cream-soft/70 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Largest board
            </dt>
            <dd className="mt-2 text-lg font-bold text-ink">
              {status ? `${status.maxGrid} × ${status.maxGrid}` : '—'}
            </dd>
          </div>

          <div className="rounded-3xl bg-cream-soft/70 p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Renewal
            </dt>
            <dd className="mt-2 text-lg font-bold text-ink">
              {status?.renewsAt ? new Date(status.renewsAt).toLocaleDateString() : 'No active plan'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {session?.signedIn ? (
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <Button asChild variant="primary">
              <Link href="/login?next=/account">Sign in</Link>
            </Button>
          )}

          {pro ? (
            <Button variant="ghost" onClick={() => void refresh()}>
              Refresh status
            </Button>
          ) : (
            <div className="w-full sm:w-auto">
              <SubscribeButton
                plan="pro-monthly"
                next="/account"
                variant="gradient"
                className="sm:w-auto"
              >
                Upgrade to Pro
              </SubscribeButton>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[2.5rem] border border-black/5 bg-white/85 p-7 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Where your patterns live</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Your five most recent projects are stored in this browser only. Signing in keeps your
            account and subscription portable, but it does not upload your artwork or patterns.
          </p>
          <Link
            href="/studio"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bead-violet hover:underline"
          >
            Open the studio
          </Link>
        </div>

        <div className="rounded-[2.5rem] border border-black/5 bg-white/85 p-7 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Manage billing</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Subscriptions are handled by Dodo Payments. Use the billing portal on your invoice email
            to update a card, cancel, or see renewal dates. Access continues until the end of the
            current period.
          </p>
          {!status?.integrations.payments ? (
            <p className="mt-4 rounded-2xl bg-state-warning/10 px-4 py-3 text-xs text-ink">
              Payments are not configured on this deployment yet, so checkout stays disabled.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
