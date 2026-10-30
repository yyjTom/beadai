'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { takeHandoffImage } from '@/lib/storage/handoff';
import { resolvePattern } from '@/lib/color/swap';
import { hashPattern } from '@/lib/utils/patternHash';
import { exportPatternPdf } from '@/lib/pdf/exportPattern';
import { exportPatternPng } from '@/lib/export/exportPatternPng';
import { loadImageDataFromUrl, type LoadedImage } from '@/lib/utils/image';
import {
  DEFAULT_GRID,
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
  const [patternHash, setPatternHash] = useState<string | null>(null);
  const { session, entitlement } = useSession(patternHash);

  const [source, setSource] = useState<StudioSource>(
    searchParams.get('source') === 'ai' ? 'ai' : 'upload',
  );
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Uploaded photo');
  const [width, setWidth] = useState<number>(DEFAULT_GRID);
  const [height, setHeight] = useState<number>(DEFAULT_GRID);
  const [brand, setBrand] = useState<PaletteBrand>('perler');
  const [denoiseLevel, setDenoiseLevel] = useState<DenoiseLevel>(1);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [basePattern, setBasePattern] = useState<PatternResult | null>(null);
  const [swapMap, setSwapMap] = useState<PatternSwapMap>({});

  const generationRef = useRef(0);
  const restoredRef = useRef(false);
  const swapMapRef = useRef(swapMap);

  useEffect(() => {
    swapMapRef.current = swapMap;
  }, [swapMap]);
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

  // Picks up the photo used on the homepage so visitors do not upload twice.
  useEffect(() => {
    if (searchParams.get('source') === 'ai') return;

    const handoff = takeHandoffImage();
    if (!handoff) return;

    let cancelled = false;
    loadImageDataFromUrl(handoff)
      .then((next) => {
        if (cancelled) return;
        setSource('upload');
        setImage(next);
        setSourceLabel('Uploaded photo');
      })
      .catch(() => {
        // Fall back to an empty studio; the visitor can upload again here.
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!image) {
      // A restored history entry has no image; do not wipe the pattern it just loaded.
      if (restoredRef.current) {
        restoredRef.current = false;
        return;
      }
      setBasePattern(null);
      return;
    }

    // Guards against a slow earlier run landing after a newer one.
    const requestToken = generationRef.current + 1;
    generationRef.current = requestToken;

    const timer = setTimeout(() => {
      generate({
        source: { width: image.width, height: image.height, data: image.data },
        width,
        height,
        brand,
        denoiseLevel,
        removeBackground,
        autoCrop,
      })
        .then((result) => {
          if (generationRef.current !== requestToken) return;
          setBasePattern(result);
          setSwapMap({});
          setError(null);
        })
        .catch((cause: Error) => {
          if (generationRef.current !== requestToken) return;
          setError(cause.message);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [image, width, height, brand, denoiseLevel, removeBackground, autoCrop, generate]);

  useEffect(() => {
    if (!basePattern) return;

    const entry: PatternHistoryEntry = {
      // Unique per project: size/brand/denoise collide across different photos.
      id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
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
      swapMap: swapMapRef.current,
      usage: basePattern.usage,
    };

    setHistory(pushHistoryEntry(entry));
    // Deliberately not keyed on swapMap: recolouring must not push a new project.
  }, [basePattern, brand, denoiseLevel, sourceLabel, source]);

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

  useEffect(() => {
    if (!pattern) {
      setPatternHash(null);
      return;
    }

    let active = true;
    void hashPattern(pattern, brand).then((hash) => {
      if (active) setPatternHash(hash || null);
    });

    return () => {
      active = false;
    };
  }, [pattern, brand]);

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
    restoredRef.current = true;
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

  const canExportPng = Boolean(pattern && pattern.width <= maxGrid && pattern.height <= maxGrid);

  const downloadPng = useCallback(() => {
    if (!pattern || !canExportPng) return;
    void exportPatternPng(pattern, brand);
  }, [pattern, canExportPng, brand]);

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
              removeBackground={removeBackground}
              onRemoveBackgroundChange={setRemoveBackground}
              autoCrop={autoCrop}
              onAutoCropChange={setAutoCrop}
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
            sourceUrl={image?.sourceUrl ?? null}
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
            canExportPng={canExportPng}
            unlockedByPurchase={entitlement?.source === 'unlock'}
            patternHash={patternHash}
            signedIn={signedIn}
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
        canExportPng={canExportPng}
        onExport={downloadPdf}
        onExportPng={downloadPng}
        onReset={() => setSwapMap({})}
      />
    </div>
  );
};
