import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        neutral: 'bg-cream-soft text-ink',
        coral: 'bg-bead-coral/15 text-bead-coral',
        amber: 'bg-bead-amber/20 text-ink',
        sky: 'bg-bead-sky/20 text-ink',
        violet: 'bg-bead-violet/15 text-bead-violet',
        success: 'bg-state-success/15 text-state-success',
        outline: 'border border-ink/15 bg-white/70 text-ink-muted',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { badgeVariants };
