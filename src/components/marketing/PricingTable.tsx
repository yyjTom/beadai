import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PricingRow {
  label: string;
  free: string;
  pro: string;
  included: boolean;
}

export const PRICING_ROWS: PricingRow[] = [
  { label: '29 × 29 patterns', free: 'Unlimited', pro: 'Unlimited', included: true },
  { label: 'PNG export', free: 'Included', pro: 'Included', included: true },
  { label: 'Photo uploads up to 10MB', free: 'Included', pro: 'Included', included: true },
  { label: 'Perler & Artkal colour matching', free: 'Included', pro: 'Included', included: true },
  { label: 'Denoise levels', free: 'Off & Light', pro: 'All four levels', included: true },
  { label: 'Shopping list with exact counts', free: 'Included', pro: 'Included', included: true },
  { label: 'Local history of recent patterns', free: 'Last 5 projects', pro: 'Last 5 projects', included: true },
  { label: 'AI generations', free: '3 per day', pro: 'Unlimited', included: false },
  { label: '58 × 58 and custom large boards', free: 'Locked', pro: 'Unlocked', included: false },
  { label: 'Colour swap with undo', free: 'Locked', pro: 'Unlocked', included: false },
  { label: 'Printable high-resolution PDF', free: 'Locked', pro: 'Unlocked', included: false },
];

export const PricingTable = ({ className }: { className?: string }) => (
  <div className={cn('overflow-hidden rounded-[2.5rem] border border-black/5 bg-white/85 shadow-soft', className)}>
    <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-black/5 bg-cream-soft/70 px-6 py-4 text-sm font-bold text-ink">
      <span>Feature</span>
      <span className="text-center">Free</span>
      <span className="text-center text-bead-violet">Pro</span>
    </div>

    <ul>
      {PRICING_ROWS.map((row) => (
        <li
          key={row.label}
          className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-black/5 px-6 py-4 text-sm last:border-b-0"
        >
          <span className="text-ink">{row.label}</span>
          <span className="flex items-center justify-center gap-2 text-center text-ink-muted">
            {row.included ? (
              <Check className="h-4 w-4 text-state-success" />
            ) : (
              <X className="h-4 w-4 text-ink/30" />
            )}
            {row.free}
          </span>
          <span className="flex items-center justify-center gap-2 text-center font-semibold text-ink">
            <Check className="h-4 w-4 text-bead-violet" />
            {row.pro}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
