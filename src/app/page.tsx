import { Hero } from '@/components/marketing/Hero';
import { PainPoints } from '@/components/marketing/PainPoints';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { AIShowcase } from '@/components/marketing/AIShowcase';
import { GalleryWall } from '@/components/marketing/GalleryWall';
import { FaqList } from '@/components/marketing/FaqList';
import { PricingTable } from '@/components/marketing/PricingTable';
import { FinalCta } from '@/components/marketing/FinalCta';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need an account to generate a bead pattern?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Uploading a photo and building a 29 x 29 pattern works without signing in. An account is needed for a Pro subscription, unlimited AI generations, or recovering a subscription on another device.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many free AI generations do I get?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Visitors get three AI generations per day, enforced on the server. Pro members get unlimited generations.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which bead brands are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'beadai ships curated Perler and Artkal palettes with colour codes and names, and re-maps patterns instantly when you switch brands.',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainPoints />
      <HowItWorks />
      <AIShowcase />
      <GalleryWall />

      <section className="container py-16" id="pricing">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">Free to try, Pro to finish</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Everything you need for a first sprite is free. Pro adds unlimited AI ideas, large
              boards, colour swaps and printable charts.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-bead-violet hover:underline"
          >
            Full pricing details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10">
          <PricingTable />
        </div>
      </section>

      <section className="container py-16" id="faq">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">Questions makers ask</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Generation limits, colour accuracy, accounts and printing — answered up front.
          </p>
        </div>
        <div className="mt-10">
          <FaqList compact />
        </div>
      </section>

      <FinalCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
