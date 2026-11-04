'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeadChartCanvas } from '@/components/studio/BeadChartCanvas';
import { UploadDropzone } from '@/components/studio/UploadDropzone';
import { usePatternWorker } from '@/hooks/usePatternWorker';
import { cacheHandoffImage } from '@/lib/storage/handoff';
import {
  DEFAULT_GRID,
  estimatePegboards,
  type DenoiseLevel,
  type PatternResult,
} from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import { loadImageDataFromUrl, type LoadedImage } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';

/**
 * The homepage previews exactly one board size: the free default. Offering a
 * second option here only pushed visitors into a size picker before they had
 * seen a single bead.
 */
const PREVIEW_GRID = DEFAULT_GRID;

const BRAND_OPTIONS: Array<{ value: PaletteBrand; label: string }> = [
  { value: 'perler', label: 'Perler' },
  { value: 'artkal', label: 'Artkal' },
];

const SAMPLE_IMAGES = [
  { src: '/samples/cat.png', label: 'Cat' },
  { src: '/samples/mushroom.png', label: 'Mushroom' },
  { src: '/samples/watermelon.png', label: 'Watermelon' },
] as const;

export const InstantPreview = () => {
  const { generate, busy } = usePatternWorker();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [brand, setBrand] = useState<PaletteBrand>('perler');
  const [denoiseLevel] = useState<DenoiseLevel>(1);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoffReady, setHandoffReady] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setPattern(null);
      setHandoffReady(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      generate({
        source: { width: image.width, height: image.height, data: image.data },
        width: PREVIEW_GRID,
        height: PREVIEW_GRID,
        brand,
        denoiseLevel,
      })
        .then((result) => {
          if (cancelled) return;
          setPattern(result);
          setError(null);
        })
        .catch((cause: Error) => {
          if (!cancelled) setError(cause.message);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [image, brand, denoiseLevel, generate]);

  const handleLoaded = useCallback((next: LoadedImage) => {
    setImage(next);
    setError(null);
    setHandoffReady(false);
    void cacheHandoffImage(next.sourceUrl).then(setHandoffReady);
  }, []);

  const loadSample = useCallback(
    async (src: string, label: string) => {
      setSampleLoading(src);
      setError(null);

      try {
        const loaded = await loadImageDataFromUrl(src);
        handleLoaded(loaded);
      } catch {
        setError(`We could not load the ${label} sample. Please upload your own photo.`);
      } finally {
        setSampleLoading(null);
      }
    },
    [handleLoaded],
  );

  const reset = useCallback(() => {
    setImage(null);
    setPattern(null);
    setError(null);
    setHandoffReady(false);
  }, []);

  const topColors = useMemo(() => (pattern ? pattern.usage.slice(0, 8) : []), [pattern]);
  const boards = pattern ? estimatePegboards(pattern.width, pattern.height) : 0;

  const sampleRow = (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        No photo handy? Try a sample
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {SAMPLE_IMAGES.map((sample) => (
          <button
            key={sample.src}
            type="button"
            disabled={sampleLoading !== null}
            onClick={() => void loadSample(sample.src, sample.label)}
            className={cn(
              'group flex items-center gap-3 rounded-2xl border border-black/5 bg-white/80 p-2 pr-4 text-left transition focus-ring',
              sampleLoading === sample.src
                ? 'opacity-60'
                : 'hover:-translate-y-0.5 hover:border-bead-violet hover:shadow-soft',
            )}
          >
            <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-cream-soft">
              {sampleLoading === sample.src ? (
                <span className="grid h-full w-full place-items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-bead-violet" />
                </span>
              ) : (
                <Image
                  src={sample.src}
                  alt={`${sample.label} sample`}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              )}
            </span>
            <span className="text-sm font-semibold text-ink">{sample.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="container py-16" id="try">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">
            Drop a photo, see the beads — right here
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            No sign-up, no upload to our servers. The conversion runs in your browser and the file
            never leaves this device.
          </p>
        </div>
        {image ? (
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Use another photo
          </Button>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <UploadDropzone busy={busy} onLoaded={handleLoaded} />
          {sampleRow}

          <div className="rounded-[2rem] border border-black/5 bg-white/90 p-5 shadow-soft">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Size</p>
              <span className="text-sm font-bold text-ink">
                {PREVIEW_GRID} × {PREVIEW_GRID}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Every size is free. This preview runs at {PREVIEW_GRID} × {PREVIEW_GRID} — about{' '}
              {estimatePegboards(PREVIEW_GRID, PREVIEW_GRID)} standard pegboards.
            </p>
            <Link
              href="/studio"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-bead-violet hover:underline focus-ring"
            >
              Need bigger? Open the studio
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Brand
            </p>
            <div className="mt-3 flex gap-2">
              {BRAND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBrand(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition focus-ring',
                    brand === option.value
                      ? 'bg-ink text-cream'
                      : 'bg-cream-soft text-ink-muted hover:bg-cream-soft/70',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
          {image ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {pattern
                      ? `${pattern.width} × ${pattern.height} · ${pattern.distinctColors} colours · ${pattern.totalBeads} beads`
                      : 'Building your chart…'}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {pattern
                      ? `${boards} standard pegboard${boards > 1 ? 's' : ''}`
                      : 'Downsampling, matching colours, cleaning stray beads'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin text-bead-violet" /> : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-3xl bg-cream-soft/70 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.sourceUrl}
                    alt="The photo you uploaded"
                    className="mx-auto max-h-[320px] w-auto rounded-2xl object-contain"
                  />
                  <figcaption className="mt-3 text-center text-xs font-semibold text-ink-muted">
                    Your photo
                  </figcaption>
                </figure>

                <div className="overflow-hidden rounded-3xl bg-cream-soft/70 p-4">
                  {pattern ? (
                    <BeadChartCanvas
                      pattern={pattern}
                      brand={brand}
                      className={cn('max-w-[420px]', busy && 'opacity-60')}
                    />
                  ) : (
                    <div className="grid h-[320px] w-full place-items-center text-sm text-ink-muted">
                      Your mosaic appears here.
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs font-semibold text-ink-muted">
                    Bead chart
                  </p>
                  <p className="mt-1 text-center text-[11px] leading-relaxed text-ink-muted">
                    Colour codes appear in the studio and in the exported chart.
                  </p>
                </div>
              </div>

              {topColors.length ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Beads you need
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topColors.map((usage) => (
                      <span
                        key={usage.color.id}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-soft"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: `rgb(${usage.color.rgb.join(', ')})` }}
                        />
                        {usage.color.code}
                        <span className="text-ink-muted">{usage.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="mt-6 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="gradient">
                  <Link href="/studio">
                    Open in the studio
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-ink-muted">
                  {handoffReady
                    ? 'We carry this photo over — no need to upload twice.'
                    : 'Studio opens with full charts, colour swaps and PDF export.'}
                </p>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center text-center">
              <div className="max-w-sm">
                <p className="text-base font-semibold text-ink">Your chart shows up here</p>
                <p className="mt-2 text-sm text-ink-muted">
                  Pick a photo with one clear subject — a pet, a game sprite, a logo. You will get a
                  bead grid and the exact colours in a couple of seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
