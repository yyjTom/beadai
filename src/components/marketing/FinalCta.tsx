import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FinalCta = () => (
  <section className="container py-16">
    <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-8 py-14 text-cream shadow-lift sm:px-14">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,253,247,0.35) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Start with a photo, finish with beads</h2>
          <p className="mt-4 text-base leading-relaxed text-cream/80">
            Open the studio, drop in an image or describe an idea, and get a printable chart with an
            exact shopping list in under a minute.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="gradient">
            <Link href="/studio">
              Open the studio
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-cream/30 bg-transparent text-cream hover:border-cream hover:bg-cream/10"
          >
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
