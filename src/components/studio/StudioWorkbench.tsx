'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SourceSwitch, type StudioSource } from '@/components/studio/SourceSwitch';
import { UploadDropzone } from '@/components/studio/UploadDropzone';
import { AIPromptPanel } from '@/components/studio/AIPromptPanel';
import { GridControls } from '@/components/studio/GridControls';
import { PatternCanvas } from '@/components/studio/PatternCanvas';
import { ColorSwapPanel } from '@/components/studio/ColorSwapPanel';
import { ShoppingList } from '@/components/studio/ShoppingList';
import { ExportPanel } from '@/components/studio/ExportPanel';
import { HistoryPanel } from '@/components/studio/HistoryPanel';
import { EntitlementCard } from '@/components/studio/EntitlementCard';
import { StickyActionBar } from '@/components/layout/StickyActionBar';
import { usePatternWorker } from '@/hooks/usePatternWorker';
import { useSession } from '@/hooks/useSession';
import { clearHistory, pushHistoryEntry, readHistory, removeHistoryEntry } from '@/lib/storage/history';
import { resolvePattern } from '@/lib/color/swap';
import { exportPatternPdf } from '@/lib/pdf/exportPattern';
import type { LoadedImage } from '@/lib/utils/image';
import {
  GRID_PRESETS,
  type DenoiseLevel,
  type PatternHistoryEntry,
  type PatternResult,
  type PatternSwapMap,
} from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import { FREE_MAX_GRID } from '@/lib/plan';

const STEPS = ['Source', 'Pattern', 'Export'];

export const StudioWorkbench = () => {
  const searchParams = useSearchParams();
  const { generate, busy: generating } = usePatternWorker();
  const { session, entitlement } = useSession();

  const [source, setSource] = useState<StudioSource>(
    searchParams.get('source') === 'ai' ? 'ai' : 'upload',
  );
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Uploaded photo');
  const [width, setWidth] = useState<number>(GRID_PRESETS[0].width);
  const [height, setHeight] = useState<number>(GRID_PRESETS[0].height);
  const [brand, setBrand] = useState<PaletteBrand>('perler');
  const [denoiseLevel, setDenoiseLevel] = useState<DenoiseLevel>(1);
  const [basePattern, setBasePattern] = useState<PatternResult | null>(null);
  const [swapMap, setSwapMap] = useState<PatternSwapMap>({});
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PatternHistoryEntry[]>([]);

  const signedIn = Boolean(session?.signedIn);
  const isPro = Boolean(entitlement?.plan === 'pro' && entitlement.active);
  const maxGrid = entitlement?.maxGrid ?? FREE_MAX_GRID;

  const pattern = useMemo(
    () => (basePattern ? resolvePattern(basePattern, swapMap, brand) : null),
    [basePattern, swapMap, brand],
  );

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (!image) {
      setBasePattern(null);
      return;
    }

    const timer = setTimeout(() => {
      generate({
        source: { width: image.width, height: image.height, data: image.data },
        width,
        height,
        brand,
        denoiseLevel,
      })
        .then((result) => {
          setBasePattern(result);
          setSwapMap({});
          setError(null);
        })
        .catch((cause: Error) => {
          setError(cause.message);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [image, width, height, brand, denoiseLevel, generate]);

  useEffect(() => {
    if (!basePattern) return;

    const entry: PatternHistoryEntry = {
      id: `${basePattern.width}x${basePattern.height}-${brand}-${denoiseLevel}`,
      title: sourceLabel,
      source: source === 'ai' ? 'ai' : 'upload',
      createdAt: Date.now(),
      width: basePattern.width,
      height: basePattern.height,
      brand,
      denoiseLevel,
      totalBeads: basePattern.totalBeads,
      thumbnail: '',
      cells: basePattern.cells,
      swapMap,
      usage: basePattern.usage,
    };

    setHistory(pushHistoryEntry(entry));
  }, [basePattern, brand, denoiseLevel, sourceLabel, source, swapMap]);

  const handleImage = useCallback((next: LoadedImage, label: string) => {
    setImage(next);
    setSourceLabel(label);
    setError(null);
  }, []);

  const requestUpgrade = useCallback(() => {
    if (!signedIn) {
      window.location.href = '/login?next=/pricing';
      return;
    }
    window.location.href = '/pricing';
  }, [signedIn]);

  const applySize = useCallback(
    (nextWidth: number, nextHeight: number) => {
      setWidth(nextWidth);
      setHeight(nextHeight);
    },
    [],
  );

  const applyDenoise = useCallback((level: DenoiseLevel) => {
    setDenoiseLevel(level);
  }, []);

  const restoreEntry = useCallback((entry: PatternHistoryEntry) => {
    setWidth(entry.width);
    setHeight(entry.height);
    setBrand(entry.brand);
    setDenoiseLevel(entry.denoiseLevel);
    setSwapMap(entry.swapMap ?? {});
    setSourceLabel(entry.title);
    setBasePattern({
      width: entry.width,
      height: entry.height,
      cells: entry.cells,
      usage: entry.usage,
      totalBeads: entry.totalBeads,
      distinctColors: entry.usage.length,
    });
  }, []);

  const downloadPdf = useCallback(() => {
    if (!pattern || !entitlement?.canExportPdf) {
      requestUpgrade();
      return;
    }
    exportPatternPdf(pattern, brand, { title: `${pattern.width} × ${pattern.height} bead pattern` });
  }, [pattern, entitlement?.canExportPdf, brand, requestUpgrade]);

  const currentStep = !image ? 0 : !pattern ? 1 : 2;

  return (
    <div className="container py-10 pb-28 lg:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">Bead studio</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Everything runs in your browser. Patterns stay on this device.
          </p>
        </div>
        <SourceSwitch value={source} onChange={setSource} />
      </div>

      <ol className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span
              className={
                index <= currentStep
                  ? 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream'
                  : 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-cream-soft text-ink-muted'
              }
            >
              {index + 1}
            </span>
            <span className={index <= currentStep ? 'font-semibold text-ink' : 'text-ink-muted'}>
              {step}
            </span>
            {index < STEPS.length - 1 ? <span className="h-px w-6 bg-ink/15" /> : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {source === 'upload' ? (
            <UploadDropzone
              busy={generating}
              onLoaded={(next) => handleImage(next, 'Uploaded photo')}
            />
          ) : (
            <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-soft">
              <AIPromptPanel
                remaining={entitlement?.aiRemaining ?? null}
                unlimited={entitlement?.aiUnlimited ?? false}
                integrationsReady={Boolean(entitlement?.integrations.ai)}
                onGenerated={(next, prompt) =>
                  handleImage(next, prompt.slice(0, 48) || 'AI pixel art')
                }
              />
            </div>
          )}

          <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-soft">
            <GridControls
              width={width}
              height={height}
              onSizeChange={applySize}
              brand={brand}
              onBrandChange={setBrand}
              denoiseLevel={denoiseLevel}
              onDenoiseChange={applyDenoise}
              maxGrid={maxGrid}
              canUseAdvanced={isPro}
              onUpgrade={requestUpgrade}
            />
          </div>

          <EntitlementCard
            signedIn={signedIn}
            plan={entitlement?.plan ?? 'free'}
            remaining={entitlement?.aiRemaining ?? null}
            unlimited={entitlement?.aiUnlimited ?? false}
            maxGrid={maxGrid}
          />
        </div>

        <div className="space-y-6">
          <PatternCanvas
            pattern={pattern}
            brand={brand}
            selectedColorId={selectedColorId}
            onSelectColor={setSelectedColorId}
            generating={generating}
          />

          {generating ? (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rebuilding the chart…
            </p>
          ) : null}

          {error ? (
            <p className="rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
              {error}
            </p>
          ) : null}

          <ColorSwapPanel
            brand={brand}
            selectedColorId={selectedColorId}
            swapMap={swapMap}
            onChange={setSwapMap}
            locked={!isPro}
            onUpgrade={requestUpgrade}
          />
        </div>

        <div className="space-y-6">
          <ShoppingList
            pattern={pattern}
            brand={brand}
            selectedColorId={selectedColorId}
            onSelectColor={setSelectedColorId}
          />

          <ExportPanel
            pattern={pattern}
            brand={brand}
            canExport={Boolean(entitlement?.canExportPdf)}
            onUpgrade={requestUpgrade}
          />

          <HistoryPanel
            entries={history}
            brand={brand}
            onRestore={restoreEntry}
            onRemove={(id) => setHistory(removeHistoryEntry(id))}
            onClear={() => setHistory(clearHistory())}
          />
        </div>
      </div>

      <StickyActionBar
        hasPattern={Boolean(pattern)}
        canExport={Boolean(entitlement?.canExportPdf)}
        onExport={downloadPdf}
        onReset={() => setSwapMap({})}
      />
    </div>
  );
};
