'use client';

import { ImageUp, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type StudioSource = 'upload' | 'ai';

export const SourceSwitch = ({
  value,
  onChange,
}: {
  value: StudioSource;
  onChange: (next: StudioSource) => void;
}) => {
  const options: Array<{ key: StudioSource; label: string; icon: typeof ImageUp }> = [
    { key: 'upload', label: 'Upload photo', icon: ImageUp },
    { key: 'ai', label: 'Describe with AI', icon: Wand2 },
  ];

  return (
    <div
      role="tablist"
      aria-label="Pattern source"
      className="inline-flex rounded-full border border-black/5 bg-white/85 p-1 shadow-soft"
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-ring',
              active ? 'bg-ink text-cream shadow-soft' : 'text-ink-muted hover:text-ink',
            )}
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
