'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { findPaletteColor } from '@/lib/color/palettes';
import { EMPTY_CELL, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

interface HoverCell {
  index: number;
  colorId: string;
}

/**
 * Above this many cells a DOM grid becomes unusable (116 × 116 is 13,456 nodes),
 * so large boards are painted on a canvas instead.
 */
const CANVAS_CELL_THRESHOLD = 5000;

const luminance = (rgb: [number, number, number]): number =>
  (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

const BeadCanvas = ({
  pattern,
  brand,
  showGrid,
  showCodes,
  cellSize,
  selectedColorId,
  generating,
  onSelectColor,
  onHover,
}: {
  pattern: PatternResult;
  brand: PaletteBrand;
  showGrid: boolean;
  showCodes: boolean;
  cellSize: number;
  selectedColorId: string | null;
  generating: boolean;
  onSelectColor: (colorId: string) => void;
  onHover: (cell: HoverCell | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverBox, setHoverBox] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = pattern.width * cellSize;
    const height = pattern.height * cellSize;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.fillStyle = '#F6F1E7';
    ctx.fillRect(0, 0, width, height);

    const gap = showGrid ? 1 : 0;

    for (let y = 0; y < pattern.height; y += 1) {
      for (let x = 0; x < pattern.width; x += 1) {
        const colorId = pattern.cells[y * pattern.width + x];
        const px = x * cellSize;
        const py = y * cellSize;
        const size = cellSize - gap;

        if (colorId === EMPTY_CELL) continue;

        const color = findPaletteColor(brand, colorId);
        if (!color) continue;

        ctx.fillStyle = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
        ctx.fillRect(px, py, size, size);

        if (selectedColorId && selectedColorId === colorId) {
          ctx.strokeStyle = '#7C5CFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, Math.max(0, size - 2), Math.max(0, size - 2));
        }

        if (showCodes && cellSize >= 12) {
          ctx.fillStyle =
            luminance(color.rgb) > 0.6 ? 'rgba(43,42,41,0.75)' : 'rgba(255,255,255,0.85)';
          ctx.font = `700 ${Math.max(6, Math.round(cellSize * 0.3))}px Poppins, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(color.code, px + size / 2, py + size / 2);
        }
      }
    }
  }, [pattern, brand, showGrid, showCodes, cellSize, selectedColorId]);

  const cellAt = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);

    if (x < 0 || y < 0 || x >= pattern.width || y >= pattern.height) return null;

    const index = y * pattern.width + x;
    return { x, y, index, colorId: pattern.cells[index] };
  };

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${pattern.width} by ${pattern.height} bead chart with ${pattern.distinctColors} colours`}
        className={generating ? 'opacity-60 transition' : 'transition'}
        onMouseMove={(event) => {
          const cell = cellAt(event);
          setHoverBox(cell ? { x: cell.x * cellSize, y: cell.y * cellSize } : null);
          onHover(cell ? { index: cell.index, colorId: cell.colorId } : null);
        }}
        onMouseLeave={() => {
          setHoverBox(null);
          onHover(null);
        }}
        onClick={(event) => {
          const cell = cellAt(event);
          if (cell && cell.colorId !== EMPTY_CELL) onSelectColor(cell.colorId);
        }}
      />

      {hoverBox ? (
        <div
          className="pointer-events-none absolute rounded-[3px] ring-2 ring-ink"
          style={{ left: hoverBox.x, top: hoverBox.y, width: cellSize, height: cellSize }}
        />
      ) : null}
    </div>
  );
};

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

  const useCanvas = Boolean(pattern && pattern.width * pattern.height > CANVAS_CELL_THRESHOLD);

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
        {pattern && useCanvas ? (
          <BeadCanvas
            pattern={pattern}
            brand={brand}
            showGrid={showGrid}
            showCodes={showCodes}
            cellSize={cellSize}
            selectedColorId={selectedColorId}
            generating={generating}
            onSelectColor={onSelectColor}
            onHover={setHover}
          />
        ) : pattern ? (
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
        <span aria-live="polite">
          {hoverColor
            ? `${hoverColor.code} · ${hoverColor.name} · rgb(${hoverColor.rgb.join(', ')})`
            : 'Hover a bead to read its colour code.'}
        </span>
        <span>Click a bead to swap that colour.</span>
      </div>
    </div>
  );
};
