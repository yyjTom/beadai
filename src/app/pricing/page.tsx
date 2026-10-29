import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingTable } from '@/components/marketing/PricingTable';
import { FaqList } from '@/components/marketing/FaqList';
import { SubscribeButton } from '@/components/auth/SubscribeButton';
import { FinalCta } from '@/components/marketing/FinalCta';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free 29 × 29 bead patterns and shopping lists. Pro unlocks unlimited AI generations, 58 × 58 boards, colour swaps and printable PDF charts.',
};

type PlanCta =
  | { label: string; href: string }
  | { label: string; plan: 'pro-monthly' | 'pro-yearly' | 'pro-lifetime' };

const PLAN_CARDS: Array<{
  key: string;
  name: string;
  price: string;
  cadence: string;
  summary: string;
  features: string[];
  cta: PlanCta;
  highlight?: boolean;
}> = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    summary: 'Everything you need for a first sprite on one pegboard.',
    features: [
      'Unlimited 29 × 29 patterns',
      'Photo uploads up to 10MB',
      'Perler & Artkal colour matching',
      'Shopping list with exact counts',
      'PNG export for 29 × 29 boards',
      '3 AI generations per day',
    ],
    cta: { label: 'Open the studio', href: '/studio' },
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$4.99',
    cadence: 'per month',
    summary: 'For makers who publish patterns, run shops, or build big pieces.',
    features: [
      'Unlimited AI generations',
      '58 × 58 and custom large boards',
      'All four denoise levels',
      'Colour swap with undo',
      'Printable high-resolution PDF charts',
    ],
    cta: { label: 'Subscribe to Pro', plan: 'pro-monthly' as const },
    highlight: true,
  },
  {
    key: 'pro-yearly',
    name: 'Pro yearly',
    price: '$39',
    cadence: 'per year',
    summary: 'The same Pro access, billed once a year — about two months free.',
    features: [
      'Unlimited AI generations',
      '58 × 58 and custom large boards',
      'All four denoise levels',
      'Colour swap with undo',
      'Printable high-resolution PDF charts',
    ],
    cta: { label: 'Subscribe yearly', plan: 'pro-yearly' as const },
  },
  {
    key: 'pro-lifetime',
    name: 'Pro once',
    price: '$49',
    cadence: 'one payment',
    summary: 'Pay once and keep Pro forever. No renewal and no card on file.',
    features: [
      'Everything in Pro, forever',
      'Unlimited AI generations',
      '58 × 58 and custom large boards',
      'Printable high-resolution PDF charts',
      'One-time payment, never renews',
    ],
    cta: { label: 'Buy Pro once', plan: 'pro-lifetime' as const },
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="container pt-14 pb-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="violet">Pricing</Badge>
          <h1 className="mt-5 text-4xl font-bold text-ink sm:text-5xl">
            Start free, upgrade when your ideas outgrow one board
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            beadai keeps the first board free forever. Pro removes the daily AI cap and opens large
            boards, colour swapping and printable charts.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {PLAN_CARDS.map((plan) => (
            <div
              key={plan.key}
              className={
                plan.highlight
                  ? 'relative rounded-[2.5rem] border border-bead-violet/40 bg-white/90 p-8 shadow-lift'
                  : 'rounded-[2.5rem] border border-black/5 bg-white/80 p-8 shadow-soft'
              }
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-8 rounded-full bg-bead-violet px-4 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              ) : null}

              <p className="text-lg font-bold text-ink">{plan.name}</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-ink">{plan.price}</span>
                <span className="pb-1 text-sm text-ink-muted">{plan.cadence}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{plan.summary}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-state-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {'href' in plan.cta ? (
                  <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href={plan.cta.href}>{plan.cta.label}</Link>
                  </Button>
                ) : (
                  <SubscribeButton plan={plan.cta.plan} next="/pricing" size="lg" variant="gradient">
                    {plan.cta.label}
                  </SubscribeButton>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-ink-muted">
          Payments are processed by Dodo Payments. Subscriptions cancel any time from your account
          page and continue until the end of the current billing period. Pro once is a single
          payment and never renews. Need just one chart? You can unlock a single pattern for
          $1.99 from the studio instead.
        </p>
      </section>

      <section className="container py-8">
        <PricingTable />
      </section>

      <section className="container py-14">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-ink">Billing and quota questions</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Everything about limits, accounts, invoices and refunds in one place.
          </p>
        </div>
        <div className="mt-10">
          <FaqList />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
