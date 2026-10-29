import type { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'The terms for using beadai: what the free tier includes, how Pro subscriptions bill and cancel, what you may do with the patterns, and the limits of our liability.',
};

const UPDATED = '30 October 2026';

const SECTIONS = [
  {
    id: 'service',
    heading: 'The service',
    paragraphs: [
      'beadai turns photos and text prompts into fuse bead patterns, with colour matches for Perler and Artkal ranges and a printable shopping list.',
      'The service is provided as-is and may change. We may add, adjust or remove features, and we may change the limits that apply to free and paid use. Material changes will be reflected on the pricing page.',
    ],
  },
  {
    id: 'accounts',
    heading: 'Your account',
    paragraphs: [
      'You can use the pattern tool without an account. An account is required for larger grids, PDF export and a higher allowance of AI generations.',
      'You are responsible for keeping access to the mailbox you sign in with, since that is how sign-in links are delivered and how we identify your account.',
    ],
  },
  {
    id: 'plans',
    heading: 'Free use and Pro',
    paragraphs: [
      'Free use is limited: the smaller grid size, a daily allowance of AI generations, and no PDF export.',
      'Pro is a subscription. It unlocks the larger grid, PDF export and unlimited AI generation for the period you have paid for.',
      'Prices and included features are shown on the pricing page at the time you subscribe.',
    ],
  },
  {
    id: 'billing',
    heading: 'Billing, renewal and cancellation',
    paragraphs: [
      'Subscriptions are processed by our payment provider, which handles card details. We never see or store your full card number.',
      'Subscriptions renew automatically at the end of each period until cancelled. You can cancel from your account page; access continues until the end of the period you have already paid for, then reverts to the free tier.',
      'If a payment fails or a subscription is refunded, entitlement reverts to the free tier. Refund requests can be sent to us and are handled case by case; where a charge was made in error we will put it right.',
    ],
  },
  {
    id: 'your-content',
    heading: 'Your images and the patterns you make',
    paragraphs: [
      'You keep the rights to the photos you upload and the patterns generated from them. We do not claim ownership of them, and we do not publish them.',
      'Because photos are processed in your browser, we do not receive or store the source image.',
    ],
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    paragraphs: [
      'Do not use beadai to create content that is unlawful, that infringes someone else’s rights, or that is intended to harass or harm.',
      'Do not attempt to break the service: no scraping at scale, no attempts to bypass quotas or rate limits, no interfering with other people’s accounts.',
      'We may rate limit, suspend or refuse service to anyone doing this.',
    ],
  },
  {
    id: 'accuracy',
    heading: 'Colour accuracy and AI output',
    paragraphs: [
      'Bead colour matching is an approximation. Screens, batches and brands vary, so check a physical bead chart before buying large quantities.',
      'AI-generated images are produced by a third-party model. They may resemble existing work, and you are responsible for how you use them commercially.',
    ],
  },
  {
    id: 'affiliate',
    heading: 'Affiliate links',
    paragraphs: [
      'Some shopping links are affiliate links, which means we may earn a commission when you buy through them. This does not change the price you pay.',
    ],
  },
  {
    id: 'liability',
    heading: 'Limits of liability',
    paragraphs: [
      'beadai is provided without warranty of any kind. To the extent permitted by law, we are not liable for indirect or consequential loss, or for loss of profits, data or goodwill arising from use of the service.',
      'Nothing here limits rights you have that cannot legally be limited.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to these terms',
    paragraphs: [
      'We may update these terms. The date below reflects the current version, and continued use after a change means you accept the updated terms.',
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="container pt-14 pb-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-ink sm:text-5xl">Terms of service</h1>
        <p className="mt-4 text-sm text-ink-muted">Last updated {UPDATED}</p>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          These terms cover using the studio, signing in, and subscribing. The short version: your
          photos and patterns stay yours, subscriptions cancel any time, and beads are approximated —
          always check a real chart before buying in bulk.
        </p>
      </div>

      <div className="mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 className="text-xl font-bold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-3xl rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-soft">
        <h2 className="text-xl font-bold text-ink">Contact</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Questions about these terms or about billing: {env.supportEmail}. How we handle your data is
          covered separately in our{' '}
          <Link href="/privacy" className="font-semibold text-bead-violet hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
