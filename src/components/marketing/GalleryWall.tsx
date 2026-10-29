'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PixelArt } from '@/components/layout/PixelArt';
import { GALLERY_PIECES, type GalleryPiece } from '@/lib/marketing/gallery';
import { cn } from '@/lib/utils/cn';

export const GalleryWall = () => {
  const [active, setActive] = useState<GalleryPiece>(GALLERY_PIECES[0]);

  return (
    <section className="container py-16" id="gallery">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">A wall of bead sprites</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Every preview below is generated with the same pipeline you get in the studio: downsample,
            Lab colour match, denoise, then count.
          </p>
        </div>
        <p className="text-sm text-ink-muted">
          Showing <span className="font-semibold text-ink">{active.title}</span>
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[2.5rem] border border-black/5 bg-white/85 p-8 shadow-lift">
          {active.imageUrl ? (
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl">
              <Image
                src={active.imageUrl}
                alt={active.imageAlt ?? active.title}
                fill
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-cover"
              />
            </div>
          ) : (
            <PixelArt
              rows={active.rows}
              palette={active.palette}
              gap={6}
              className="mx-auto w-full max-w-md"
            />
          )}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xl font-bold text-ink">{active.title}</p>
              <p className="text-sm text-ink-muted">
                {active.size} · {active.colors} colours · {active.beads} beads
              </p>
            </div>
            <span className="rounded-full bg-cream-soft px-4 py-2 text-xs font-semibold text-ink-muted">
              {active.imageUrl ? 'AI-generated example' : 'Preview artwork'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {GALLERY_PIECES.map((piece) => (
            <button
              key={piece.id}
              type="button"
              onClick={() => setActive(piece)}
              aria-pressed={active.id === piece.id}
              className={cn(
                'group rounded-3xl border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lift focus-ring',
                active.id === piece.id
                  ? 'border-bead-violet bg-white shadow-lift'
                  : 'border-black/5 bg-white/70 shadow-soft',
              )}
            >
              <PixelArt rows={piece.rows} palette={piece.palette} gap={2} className="w-full" />
              <p className="mt-3 text-sm font-semibold text-ink">{piece.title}</p>
              <p className="text-xs text-ink-muted">{piece.size}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
