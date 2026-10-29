import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FaqList } from '@/components/marketing/FaqList';
import { FinalCta } from '@/components/marketing/FinalCta';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description:
    'Answers about bead pattern generation, AI limits, Perler and Artkal colour matching, accounts, subscriptions and printable PDF exports.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <section className="container pt-14 pb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-ink sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Generation limits, colour accuracy, accounts, printing and billing — answered without the
            fluff.
          </p>
        </div>
      </section>

      <section className="container pb-10" id="generation">
        <FaqList />
      </section>

      <section className="container pb-16">
        <div className="rounded-[2.5rem] border border-black/5 bg-white/85 p-8 shadow-soft">
          <h2 className="text-xl font-bold text-ink">Still stuck?</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Email {env.supportEmail} with the pattern size and the image or prompt you used, and we
            will help you get it onto a pegboard.
          </p>
          <Link
            href="/studio"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bead-violet hover:underline"
          >
            Try the studio instead
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
