import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ImageDown, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelArt } from '@/components/layout/PixelArt';
import { HERO_ART } from '@/lib/marketing/gallery';

export const Hero = () => (
  <section className="container relative pt-16 pb-10">
    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-ink shadow-soft">
          <Sparkles className="h-4 w-4 text-bead-violet" />
          Photo to bead pattern · AI pixel art to bead pattern
        </span>

        <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
          Turn any photo or idea into a{' '}
          <span className="gradient-text">real bead pattern</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          beadai maps every pixel to real Perler and Artkal colour codes, cleans up stray beads so
          blocks stay placeable, and hands you an exact shopping list — all inside your browser.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="gradient">
            <Link href="#try">
              <ImageDown className="h-5 w-5" />
              Upload a photo
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/studio?source=ai">
              <Wand2 className="h-5 w-5" />
              Describe with AI
            </Link>
          </Button>
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
          <li>No sign-up to start</li>
          <li className="hidden h-1 w-1 rounded-full bg-ink/20 sm:block" />
          <li>29 × 29 patterns are free</li>
          <li className="hidden h-1 w-1 rounded-full bg-ink/20 sm:block" />
          <li>3 free AI generations a day</li>
        </ul>
      </div>

      <div className="relative animate-pop-in">
        <div className="absolute -inset-6 rounded-[3rem] bg-brand-glow blur-2xl" aria-hidden="true" />
        <div className="relative rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{HERO_ART.title}</p>
              <p className="text-xs text-ink-muted">
                {HERO_ART.size} · {HERO_ART.colors} colours · {HERO_ART.beads} beads
              </p>
            </div>
            <span className="rounded-full bg-bead-amber/25 px-3 py-1 text-xs font-semibold text-ink">
              Live preview
            </span>
          </div>

          <Image
            src="/gallery/bead-desk.png"
            alt="Desk with white pegboards, half-finished bead sprites and bowls of sorted beads"
            width={960}
            height={540}
            sizes="(max-width: 1024px) 90vw, 480px"
            className="mt-5 h-36 w-full rounded-2xl object-cover"
          />

          <div className="mt-5 grid grid-cols-2 gap-4">
            <PixelArt
              rows={HERO_ART.rows}
              palette={HERO_ART.palette}
              gap={2}
              className="rounded-2xl bg-cream-soft p-3"
            />
            <PixelArt
              rows={HERO_ART.rows}
              palette={HERO_ART.palette}
              gap={3}
              className="rounded-2xl border border-dashed border-ink/15 bg-white p-3"
            />
          </div>

          <div className="mt-5 rounded-2xl bg-cream-soft/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Shopping list preview
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['Black', 148],
                ['Cheddar', 96],
                ['Coral', 74],
                ['Sky', 62],
              ].map(([name, count]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-soft"
                >
                  {name}
                  <span className="text-ink-muted">{count}</span>
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/studio"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bead-violet hover:underline"
          >
            Open the studio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);
