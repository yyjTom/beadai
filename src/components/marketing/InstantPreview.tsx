'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { LoadedImage } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';

const SIZE_OPTIONS = [
  { width: 29, height: 29, label: '29 × 29', hint: 'one pegboard' },
  { width: 58, height: 58, label: '58 × 58', hint: 'four pegboards' },
] as const;

const BRAND_OPTIONS: Array<{ value: PaletteBrand; label: string }> = [
  { value: 'perler', label: 'Perler' },
  { value: 'artkal', label: 'Artkal' },
];

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

  const reset = useCallback(() => {
    setImage(null);
    setPattern(null);
    setError(null);
    setHandoffReady(false);
  }, []);

  const cellSize = useMemo(() => (size.width > 40 ? 11 : 17), [size.width]);
  const topColors = useMemo(() => (pattern ? pattern.usage.slice(0, 8) : []), [pattern]);

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
                          ? 'border-bead-violet bg-white shadow-soft text-ink'
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
                      ? `${estimatePegboards(pattern.width, pattern.height)} standard pegboard${
                          estimatePegboards(pattern.width, pattern.height) > 1 ? 's' : ''
                        }`
                      : 'Downsampling, matching colours, cleaning stray beads'}
                  </p>
                </div>
                {busy ? <Loader2 className="h-5 w-5 animate-spin text-bead-violet" /> : null}
              </div>

              <div className="mt-6 flex justify-center overflow-auto rounded-3xl bg-cream-soft/70 p-5">
                {pattern ? (
                  <div
                    className={busy ? 'opacity-60 transition' : 'transition'}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${pattern.width}, ${cellSize}px)`,
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
                          className="bead-dot"
                          style={{
                            width: cellSize,
                            height: cellSize,
                            background: isEmpty
                              ? 'transparent'
                              : `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 46%), rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid h-[320px] w-full place-items-center text-sm text-ink-muted">
                    Your mosaic appears here.
                  </div>
                )}
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
