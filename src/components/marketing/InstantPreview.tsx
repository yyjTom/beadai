'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { UploadDropzone } from '@/components/studio/UploadDropzone';
import { usePatternWorker } from '@/hooks/usePatternWorker';
import { useSession } from '@/hooks/useSession';
import { findPaletteColor } from '@/lib/color/palettes';
import { cacheHandoffImage } from '@/lib/storage/handoff';
import { FREE_MAX_GRID } from '@/lib/plan';
import {
  EMPTY_CELL,
  estimatePegboards,
  type DenoiseLevel,
  type PatternResult,
} from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import { loadImageDataFromUrl, type LoadedImage } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';

const SIZE_OPTIONS = [
  { width: 29, height: 29, label: '29 × 29', hint: 'one pegboard' },
  { width: 58, height: 58, label: '58 × 58', hint: 'four pegboards' },
] as const;

const BRAND_OPTIONS: Array<{ value: PaletteBrand; label: string }> = [
  { value: 'perler', label: 'Perler' },
  { value: 'artkal', label: 'Artkal' },
];

const SAMPLE_IMAGES = [
  { src: '/samples/cat.png', label: 'Cat' },
  { src: '/samples/mushroom.png', label: 'Mushroom' },
] as const;

export const InstantPreview = () => {
  const { generate, busy } = usePatternWorker();
  const { entitlement } = useSession();

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [brand, setBrand] = useState<PaletteBrand>('perler');
  const [denoiseLevel] = useState<DenoiseLevel>(1);
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoffReady, setHandoffReady] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);

  const maxGrid = entitlement?.maxGrid ?? FREE_MAX_GRID;
  const size = SIZE_OPTIONS[sizeIndex];

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
        width: size.width,
        height: size.height,
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
  }, [image, size.width, size.height, brand, denoiseLevel, generate]);

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
  const codesAvailable = Boolean(pattern && pattern.width <= 40);
  const codeFontSize = pattern ? Math.max(6, Math.round(190 / pattern.width)) : 7;
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
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((option, index) => {
                const locked = option.width > maxGrid;
                return (
                  <button
                    key={option.label}
                    type="button"
                    disabled={locked}
                    onClick={() => setSizeIndex(index)}
                    className={cn(
                      'rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition focus-ring',
                      locked
                        ? 'cursor-not-allowed border-black/5 bg-cream-soft text-ink-muted'
                        : sizeIndex === index
                          ? 'border-bead-violet bg-white text-ink shadow-soft'
                          : 'border-black/5 bg-white/70 text-ink-muted hover:border-ink/20',
                    )}
                  >
                    {option.label}
                    <span className="block text-xs font-normal text-ink-muted">
                      {locked ? 'Pro only' : option.hint}
                    </span>
                  </button>
                );
              })}
            </div>

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
                  <label
                    className={cn(
                      'flex items-center gap-2 text-xs font-semibold',
                      codesAvailable ? 'text-ink-muted' : 'text-ink/40',
                    )}
                  >
                    <Switch
                      checked={showCodes && codesAvailable}
                      onCheckedChange={setShowCodes}
                      disabled={!codesAvailable}
                    />
                    Codes
                  </label>
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
                    <div
                      className={cn('mx-auto w-full max-w-[420px]', busy && 'opacity-60')}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${pattern.width}, minmax(0, 1fr))`,
                        gap: '1px',
                      }}
                    >
                      {pattern.cells.map((colorId, index) => {
                        const color = findPaletteColor(brand, colorId);
                        const isEmpty = colorId === EMPTY_CELL;
                        const rgb = color ? color.rgb : [255, 255, 255];

                        return (
                          <span
                            key={index}
                            className="bead-dot flex items-center justify-center"
                            style={{
                              aspectRatio: '1 / 1',
                              background: isEmpty
                                ? 'transparent'
                                : `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 46%), rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                              fontSize: codeFontSize,
                              fontWeight: 700,
                              lineHeight: 1,
                              color: 'rgba(43,42,41,0.8)',
                            }}
                          >
                            {showCodes && codesAvailable && color ? color.code : null}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid h-[320px] w-full place-items-center text-sm text-ink-muted">
                      Your mosaic appears here.
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs font-semibold text-ink-muted">
                    Bead chart
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
