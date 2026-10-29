'use client';

import { useState } from 'react';
import { FileDown, Image as ImageIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscribeButton } from '@/components/auth/SubscribeButton';
import { exportPatternPdf } from '@/lib/pdf/exportPattern';
import { exportPatternPng } from '@/lib/export/exportPatternPng';
import type { PaletteBrand, PatternResult } from '@/types/pattern';

export const ExportPanel = ({
  pattern,
  brand,
  canExport,
  canExportPng,
  unlockedByPurchase,
  patternHash,
  signedIn,
  onUpgrade,
}: {
  pattern: PatternResult | null;
  brand: PaletteBrand;
  canExport: boolean;
  canExportPng: boolean;
  unlockedByPurchase?: boolean;
  patternHash: string | null;
  signedIn: boolean;
  onUpgrade: () => void;
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const downloadPdf = () => {
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

  const downloadPng = async () => {
    if (!pattern || !canExportPng) return;
    setExportingPng(true);
    try {
      await exportPatternPng(pattern, brand);
    } catch (error) {
      console.error('[export] png generation failed', error);
    } finally {
      setExportingPng(false);
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

      <div className="mt-5 space-y-3">
        {canExportPng ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void downloadPng()}
            disabled={!pattern || exportingPng}
          >
            <ImageIcon className="h-4 w-4" />
            {exportingPng ? 'Rendering PNG…' : 'Download PNG'}
          </Button>
        ) : null}

        {canExport ? (
          <Button
            type="button"
            variant="gradient"
            className="w-full"
            onClick={downloadPdf}
            disabled={!pattern || exporting}
          >
            <FileDown className="h-4 w-4" />
            {exporting ? 'Building your PDF…' : 'Download PDF chart'}
          </Button>
        ) : (
          <>
            <SubscribeButton
              plan="single-unlock"
              patternHash={patternHash}
              next="/studio"
              variant="gradient"
            >
              Unlock this pattern — $1.99
            </SubscribeButton>

            <Button type="button" variant="outline" className="w-full" onClick={onUpgrade}>
              See Pro instead
            </Button>
          </>
        )}
      </div>

      {!pattern ? (
        <p className="mt-4 text-xs text-ink-muted">
          Generate a pattern first, then export it for printing.
        </p>
      ) : null}

      {pattern && !canExport && !signedIn ? (
        <p className="mt-3 text-xs text-ink-muted">
          Sign in first — the unlock is attached to your account, not this browser.
        </p>
      ) : null}

      {canExport && unlockedByPurchase ? (
        <p className="mt-3 text-xs text-ink-muted">
          This pattern is unlocked. Any change to the grid, colours or brand creates a new
          pattern, which needs its own unlock.
        </p>
      ) : null}

      {canExportPng && !canExport ? (
        <p className="mt-3 text-xs text-ink-muted">
          PNG export is free inside your board size. PDF charts and larger boards are part of
          Pro.
        </p>
      ) : null}
    </div>
  );
};
