'use client';

import { FileDown, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StickyActionBar = ({
  onExport,
  onReset,
  canExport,
  hasPattern,
}: {
  onExport: () => void;
  onReset: () => void;
  canExport: boolean;
  hasPattern: boolean;
}) => {
  if (!hasPattern) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-cream/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onReset}>
          <Undo2 className="h-4 w-4" />
          Reset swaps
        </Button>
        <Button
          variant="gradient"
          size="sm"
          className="flex-1"
          onClick={onExport}
          disabled={!canExport}
        >
          <FileDown className="h-4 w-4" />
          {canExport ? 'Export PDF' : 'Pro only'}
        </Button>
      </div>
    </div>
  );
};
