'use client';

import { ShoppingBag } from 'lucide-react';
import { buildPurchaseLink } from '@/lib/commerce/affiliate';
import type { BeadUsage, PaletteBrand, PatternResult } from '@/types/pattern';
import { cn } from '@/lib/utils/cn';

export const ShoppingList = ({
  pattern,
  brand,
  selectedColorId,
  onSelectColor,
}: {
  pattern: PatternResult | null;
  brand: PaletteBrand;
  selectedColorId: string | null;
  onSelectColor: (colorId: string) => void;
}) => {
  const usage: BeadUsage[] = pattern?.usage ?? [];
  const total = pattern?.totalBeads ?? 0;

  return (
    <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShoppingBag className="h-4 w-4 text-bead-coral" />
            Shopping list
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {usage.length > 0
              ? `${usage.length} colours · ${total} beads`
              : 'Counts appear once a pattern is ready.'}
          </p>
        </div>
        {total > 0 ? (
          <span className="rounded-full bg-cream-soft px-4 py-1.5 text-sm font-bold text-ink">
            {total} beads
          </span>
        ) : null}
      </div>

      {usage.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-cream-soft/70 p-5 text-sm text-ink-muted">
          Your colour list will build itself as soon as an image is converted.
        </p>
      ) : (
        <ul className="mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {usage.map((entry) => {
            const link = buildPurchaseLink(entry.color);
            const active = selectedColorId === entry.color.id;

            return (
              <li
                key={entry.color.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3 transition',
                  active ? 'border-bead-violet bg-white shadow-soft' : 'border-black/5 bg-white/70',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectColor(entry.color.id)}
                  className="flex flex-1 items-center gap-3 text-left focus-ring"
                >
                  <span
                    className="bead-dot h-9 w-9 shrink-0"
                    style={{ background: `rgb(${entry.color.rgb.join(', ')})` }}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {entry.color.code} · {entry.color.name}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {entry.count} beads ·{' '}
                      {total > 0 ? Math.round((entry.count / total) * 100) : 0}% of the board
                    </span>
                  </span>
                </button>

                {link.configured ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-bead-violet hover:text-bead-violet"
                  >
                    Buy
                  </a>
                ) : (
                  <span className="rounded-full bg-cream-soft px-3 py-1.5 text-xs text-ink-muted">
                    Soon
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
        Buy links may earn beadai a commission at no extra cost. Swatches are planning
        approximations, so check a physical bead chart before large orders.
      </p>
    </div>
  );
};
