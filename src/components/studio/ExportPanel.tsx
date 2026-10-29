'use client';

import { useState } from 'react';
import { FileDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportPatternPdf } from '@/lib/pdf/exportPattern';
import type { PaletteBrand, PatternResult } from '@/types/pattern';

export const ExportPanel = ({
  pattern,
  brand,
  canExport,
  onUpgrade,
}: {
  pattern: PatternResult | null;
  brand: PaletteBrand;
  canExport: boolean;
  onUpgrade: () => void;
}) => {
  const [exporting, setExporting] = useState(false);

  const download = () => {
    if (!pattern || !canExport) return;
    setExporting(true);
    try {
      exportPatternPdf(pattern, brand, {
        title: `${pattern.width} × ${pattern.height} bead pattern`,
      });
    } catch (error) {
      console.error('[export] pdf generation failed', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-black/5 bg-white/90 p-6 shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileDown className="h-4 w-4 text-bead-violet" />
          Printable chart
        </p>
        {canExport ? null : (
          <Badge variant="outline">
            <Lock className="h-3 w-3" />
            Pro
          </Badge>
        )}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
        A high-resolution PDF with a clean grid, tiny colour codes in every cell, and the full
        shopping list on a second page.
      </p>

      {canExport ? (
        <Button
          type="button"
          variant="gradient"
          className="mt-5 w-full"
          onClick={download}
          disabled={!pattern || exporting}
        >
          <FileDown className="h-4 w-4" />
          {exporting ? 'Building your PDF…' : 'Download PDF chart'}
        </Button>
      ) : (
        <Button type="button" variant="gradient" className="mt-5 w-full" onClick={onUpgrade}>
          Unlock PDF export
        </Button>
      )}

      {!pattern ? (
        <p className="mt-4 text-xs text-ink-muted">
          Generate a pattern first, then export it for printing.
        </p>
      ) : null}
    </div>
  );
};
