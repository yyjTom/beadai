import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base text-ink shadow-inner outline-none transition',
        'placeholder:text-ink-muted/70 focus:border-bead-violet focus:ring-2 focus:ring-bead-violet/25 disabled:cursor-not-allowed disabled:bg-cream-soft',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-2xl border border-ink/15 bg-white p-4 text-base text-ink shadow-inner outline-none transition',
      'placeholder:text-ink-muted/70 focus:border-bead-violet focus:ring-2 focus:ring-bead-violet/25 disabled:cursor-not-allowed disabled:bg-cream-soft',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
