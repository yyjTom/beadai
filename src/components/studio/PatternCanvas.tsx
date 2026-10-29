'use client';

import { useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { findPaletteColor } from '@/lib/color/palettes';
import { EMPTY_CELL, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

interface HoverCell {
  index: number;
  colorId: string;
}

export const PatternCanvas = ({
  pattern,
  brand,
  selectedColorId,
  onSelectColor,
  generating,
}: {
  pattern: PatternResult | null;
  brand: PaletteBrand;
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
  generating: boolean;
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const [showCodes, setShowCodes] = useState(false);
  const [hover, setHover] = useState<HoverCell | null>(null);

  const cellSize = useMemo(() => {
    if (!pattern) return 18;
    return pattern.width > 60 ? 8 : pattern.width > 40 ? 12 : 18;
  }, [pattern]);

  const hoverColor = hover ? findPaletteColor(brand, hover.colorId) : null;

  return (
    <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Bead preview</p>
          <p className="text-xs text-ink-muted">
            {pattern
              ? `${pattern.width} × ${pattern.height} · ${pattern.distinctColors} colours · ${pattern.totalBeads} beads`
              : 'Upload an image or generate one to see the chart.'}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <Switch checked={showGrid} onCheckedChange={setShowGrid} />
            Grid
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <Switch checked={showCodes} onCheckedChange={setShowCodes} />
            Codes
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-center overflow-auto rounded-3xl bg-cream-soft/70 p-5">
        {pattern ? (
          <div
            className={generating ? 'opacity-60 transition' : 'transition'}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${pattern.width}, ${cellSize}px)`,
              gap: showGrid ? '1px' : '0px',
            }}
            onMouseLeave={() => setHover(null)}
          >
            {pattern.cells.map((colorId, index) => {
              const color = findPaletteColor(brand, colorId);
              const isEmpty = colorId === EMPTY_CELL;
              const rgb = color ? color.rgb : [255, 255, 255];

              return (
                <button
                  key={index}
                  type="button"
                  aria-label={color ? `${color.code} ${color.name}` : 'Empty cell'}
                  onMouseEnter={() => setHover({ index, colorId })}
                  onClick={() => color && onSelectColor(colorId)}
                  className="bead-dot hover:z-10 hover:scale-125 focus-ring"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: isEmpty
                      ? 'transparent'
                      : `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), transparent 46%), rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                    border:
                      selectedColorId && selectedColorId === colorId
                        ? '2px solid #7C5CFF'
                        : undefined,
                    cursor: color ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(5, cellSize * 0.32),
                    fontWeight: 700,
                    color: 'rgba(43,42,41,0.75)',
                  }}
                >
                  {showCodes && color && cellSize >= 12 ? color.code : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid h-[360px] w-full place-items-center text-sm text-ink-muted">
            Your mosaic appears here.
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <span>
          {hoverColor
            ? `${hoverColor.code} · ${hoverColor.name} · rgb(${hoverColor.rgb.join(', ')})`
            : 'Hover a bead to read its colour code.'}
        </span>
        <span>Click a bead to swap that colour.</span>
      </div>
    </div>
  );
};
