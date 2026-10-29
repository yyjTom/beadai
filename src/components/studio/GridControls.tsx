'use client';

import { Info, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DENOISE_LEVELS, DENOISE_PROFILES } from '@/lib/color/denoise';
import { GRID_PRESETS, estimatePegboards, type DenoiseLevel } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import { cn } from '@/lib/utils/cn';

export const GridControls = ({
  width,
  height,
  onSizeChange,
  brand,
  onBrandChange,
  denoiseLevel,
  onDenoiseChange,
  maxGrid,
  canUseAdvanced,
  onUpgrade,
}: {
  width: number;
  height: number;
  onSizeChange: (width: number, height: number) => void;
  brand: PaletteBrand;
  onBrandChange: (brand: PaletteBrand) => void;
  denoiseLevel: DenoiseLevel;
  onDenoiseChange: (level: DenoiseLevel) => void;
  maxGrid: number;
  canUseAdvanced: boolean;
  onUpgrade: () => void;
}) => {
  const isPreset = (presetWidth: number, presetHeight: number) =>
    width === presetWidth && height === presetHeight;

  const isCustom = !GRID_PRESETS.some((preset) => isPreset(preset.width, preset.height));

  const boards = estimatePegboards(width, height);

  const applyPreset = (presetWidth: number, presetHeight: number) => {
    if (!canUseAdvanced && presetWidth > maxGrid) {
      onUpgrade();
      return;
    }
    onSizeChange(presetWidth, presetHeight);
  };

  const applyCustom = (value: number) => {
    if (!canUseAdvanced && value > maxGrid) {
      onUpgrade();
      return;
    }
    onSizeChange(value, value);
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-ink">Board size</p>
        <div className="mt-3 grid gap-3">
          {GRID_PRESETS.map((preset) => {
            const locked = !canUseAdvanced && preset.width > maxGrid;
            const active = isPreset(preset.width, preset.height);

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.width, preset.height)}
                className={cn(
                  'rounded-3xl border p-4 text-left transition focus-ring',
                  active
                    ? 'border-bead-violet bg-white shadow-lift'
                    : 'border-black/5 bg-white/70 hover:-translate-y-0.5 hover:shadow-soft',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-ink">{preset.label}</span>
                  {locked ? (
                    <Badge variant="outline">
                      <Lock className="h-3 w-3" />
                      Pro
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-ink-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {preset.hint}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-3xl border border-black/5 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="custom-size" className="text-sm font-semibold text-ink">
              Custom square grid
            </label>
            <span className="text-sm font-bold text-ink">
              {width} × {height}
            </span>
          </div>
          <input
            id="custom-size"
            type="range"
            min={15}
            max={116}
            step={1}
            value={width}
            onChange={(event) => applyCustom(Number(event.target.value))}
            className="mt-4 w-full accent-bead-violet"
          />
          <p className="mt-2 text-xs text-ink-muted">
            {isCustom ? 'Custom size' : 'Preset size'} · about {boards} standard pegboard
            {boards > 1 ? 's' : ''} · {width * height} cells
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Bead brand</p>
        <div className="mt-3 inline-flex rounded-full border border-black/5 bg-white/85 p-1 shadow-soft">
          {(['perler', 'artkal'] as PaletteBrand[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onBrandChange(option)}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold capitalize transition focus-ring',
                brand === option ? 'bg-ink text-cream' : 'text-ink-muted hover:text-ink',
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Codes and counts update instantly when you switch brands.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Denoise level</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DENOISE_LEVELS.map((level) => {
            const locked = !canUseAdvanced && level > 1;
            const active = denoiseLevel === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => (locked ? onUpgrade() : onDenoiseChange(level))}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left transition focus-ring',
                  active
                    ? 'border-bead-violet bg-white shadow-lift'
                    : 'border-black/5 bg-white/70 hover:shadow-soft',
                )}
              >
                <span className="flex items-center justify-between text-sm font-bold text-ink">
                  {DENOISE_PROFILES[level].label}
                  {locked ? <Lock className="h-3.5 w-3.5 text-ink-muted" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          {DENOISE_PROFILES[denoiseLevel].description}
        </p>
      </div>

      {!canUseAdvanced ? (
        <Button variant="gradient" className="w-full" onClick={onUpgrade}>
          Unlock 58 × 58, strong denoise and PDF export
        </Button>
      ) : null}
    </div>
  );
};
