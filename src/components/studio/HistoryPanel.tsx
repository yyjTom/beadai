'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PixelArt } from '@/components/layout/PixelArt';
import { findPaletteColor } from '@/lib/color/palettes';
import { EMPTY_CELL, type PatternHistoryEntry } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import { cn } from '@/lib/utils/cn';

const previewRows = (
  entry: PatternHistoryEntry,
  brand: PaletteBrand,
): { rows: string[]; palette: Record<string, string> } => {
  const step = Math.max(1, Math.ceil(entry.width / 14));
  const rows: string[] = [];
  const palette: Record<string, string> = {};
  const slots = 'abcdefghijklmnopqrstuvwxyz';
  const chars = new Map<string, string>();

  for (let y = 0; y < entry.height; y += step) {
    let row = '';
    for (let x = 0; x < entry.width; x += step) {
      const raw = entry.cells[y * entry.width + x] ?? EMPTY_CELL;
      const id = entry.swapMap[raw] ?? raw;

      if (id === EMPTY_CELL) {
        row += '.';
        continue;
      }

      const color = findPaletteColor(brand, id);
      if (!color) {
        row += '.';
        continue;
      }

      let char = chars.get(id);
      if (!char) {
        char = slots[chars.size] ?? 'z';
        chars.set(id, char);
        palette[char] = `rgb(${color.rgb.join(', ')})`;
      }

      row += char;
    }
    rows.push(row);
  }

  return { rows, palette };
};

export const HistoryPanel = ({
  entries,
  brand,
  onRestore,
  onRemove,
  onClear,
}: {
  entries: PatternHistoryEntry[];
  brand: PaletteBrand;
  onRestore: (entry: PatternHistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) => (
  <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-ink">Recent projects</p>
        <p className="mt-1 text-xs text-ink-muted">
          Stored in this browser only — the newest five patterns.
        </p>
      </div>
      {entries.length > 0 ? (
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </div>

    {entries.length === 0 ? (
      <p className="mt-5 rounded-2xl bg-cream-soft/70 p-5 text-sm text-ink-muted">
        Your recent patterns will show up here after the first conversion.
      </p>
    ) : (
      <ul className="mt-5 space-y-3">
        {entries.map((entry) => {
          const preview = previewRows(entry, brand);
          return (
            <li
              key={entry.id}
              className={cn(
                'flex items-center gap-4 rounded-2xl border border-black/5 bg-white/80 p-3 transition hover:shadow-soft',
              )}
            >
              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="flex flex-1 items-center gap-4 text-left focus-ring"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-soft p-1.5">
                  <PixelArt rows={preview.rows} palette={preview.palette} gap={1} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{entry.title}</span>
                  <span className="block text-xs text-ink-muted">
                    {entry.width} × {entry.height} · {entry.totalBeads} beads ·{' '}
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </span>
              </button>

              <button
                type="button"
                aria-label={`Remove ${entry.title}`}
                onClick={() => onRemove(entry.id)}
                className="rounded-full p-2 text-ink-muted transition hover:bg-state-danger/10 hover:text-state-danger focus-ring"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
