import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-cream shadow-soft hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-0',
        accent:
          'bg-bead-coral text-white shadow-soft hover:-translate-y-0.5 hover:bg-bead-coral/90 active:translate-y-0',
        gradient:
          'bg-gradient-to-r from-bead-coral via-bead-amber to-bead-sky text-ink shadow-lift hover:-translate-y-0.5 active:translate-y-0',
        outline:
          'border border-ink/15 bg-white/80 text-ink hover:border-ink/35 hover:bg-white hover:-translate-y-0.5',
        ghost: 'text-ink-muted hover:bg-ink/5 hover:text-ink',
        soft: 'bg-cream-soft text-ink hover:bg-cream-soft/70',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
