'use client';

import { Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rankedPaletteMatches } from '@/lib/color/match';
import { findPaletteColor } from '@/lib/color/palettes';
import { resetSwap, withSwap } from '@/lib/color/swap';
import type { PaletteBrand, PatternSwapMap } from '@/types/pattern';
import { cn } from '@/lib/utils/cn';

export const ColorSwapPanel = ({
  brand,
  selectedColorId,
  swapMap,
  onChange,
  locked,
  onUpgrade,
}: {
  brand: PaletteBrand;
  selectedColorId: string | null;
  swapMap: PatternSwapMap;
  onChange: (next: PatternSwapMap) => void;
  locked: boolean;
  onUpgrade: () => void;
}) => {
  const source = selectedColorId ? findPaletteColor(brand, selectedColorId) : null;
  const currentTargetId = selectedColorId ? (swapMap[selectedColorId] ?? null) : null;
  const currentTarget = currentTargetId ? findPaletteColor(brand, currentTargetId) : null;
  const matches = selectedColorId ? rankedPaletteMatches(selectedColorId, brand, 18) : [];

  return (
    <div className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Colour swap</p>
        {locked ? <Badge variant="outline">Pro</Badge> : null}
      </div>

      {!source ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Click a bead in the preview or a colour row in the shopping list to replace it with a
          closer match.
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream-soft/70 p-3">
            <div className="flex items-center gap-3">
              <span
                className="bead-dot h-8 w-8"
                style={{ background: `rgb(${source.rgb.join(', ')})` }}
              />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {source.code} · {source.name}
                </p>
                <p className="text-xs text-ink-muted">Selected colour</p>
              </div>
            </div>

            {currentTarget ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onChange(resetSwap(swapMap, source.id))}
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
            ) : null}
          </div>

          {locked ? (
            <Button variant="gradient" className="mt-4 w-full" onClick={onUpgrade}>
              Unlock colour swap with Pro
            </Button>
          ) : (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Closest matches
              </p>
              <div className="mt-3 grid grid-cols-6 gap-2">
                {matches.map((color) => {
                  const active = currentTargetId === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      title={`${color.code} · ${color.name}`}
                      onClick={() => onChange(withSwap(swapMap, source.id, color.id))}
                      className={cn(
                        'bead-dot h-9 w-9 border-2 border-transparent focus-ring',
                        active && 'border-bead-violet',
                      )}
                      style={{ background: `rgb(${color.rgb.join(', ')})` }}
                    />
                  );
                })}
              </div>

              {currentTarget ? (
                <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                  Replaced with <span className="font-semibold text-ink">{currentTarget.code} · {currentTarget.name}</span>.
                  Counts and the shopping list update instantly.
                </p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};
