'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePattern } from '@/lib/pattern/generate';
import type { DenoiseLevel, PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';
import type { PatternWorkerRequest, PatternWorkerResponse } from '@/workers/pattern.worker';

export interface GenerateArgs {
  source: { width: number; height: number; data: Uint8ClampedArray };
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
  removeBackground?: boolean;
  autoCrop?: boolean;
}

export interface UsePatternWorkerResult {
  generate: (args: GenerateArgs) => Promise<PatternResult>;
  busy: boolean;
  error: string | null;
}

export const usePatternWorker = (): UsePatternWorkerResult => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (value: PatternResult) => void; reject: (error: Error) => void }>>(
    new Map(),
  );
  const requestIdRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackGenerate = useCallback(async (args: GenerateArgs): Promise<PatternResult> => {
    return generatePattern({
      source: args.source,
      width: args.width,
      height: args.height,
      brand: args.brand,
      denoiseLevel: args.denoiseLevel,
      removeBackground: args.removeBackground,
      autoCrop: args.autoCrop,
    });
  }, []);

  const generate = useCallback(
    async (args: GenerateArgs): Promise<PatternResult> => {
      requestIdRef.current += 1;
      const requestId = `req-${requestIdRef.current}`;
      setBusy(true);
      setError(null);

      let worker = workerRef.current;
      if (!worker && typeof Worker !== 'undefined') {
        try {
          worker = new Worker(new URL('../workers/pattern.worker.ts', import.meta.url));
          worker.onmessage = (event: MessageEvent<PatternWorkerResponse>) => {
            const message = event.data;
            const pending = pendingRef.current.get(message.requestId);
            if (!pending) return;
            pendingRef.current.delete(message.requestId);
            if (message.type === 'done') pending.resolve(message.pattern);
            else pending.reject(new Error(message.message));
          };
          worker.onerror = () => {
            for (const pending of pendingRef.current.values()) {
              pending.reject(new Error('The pattern worker crashed.'));
            }
            pendingRef.current.clear();
          };
          workerRef.current = worker;
        } catch {
          console.error('[usePatternWorker] worker unavailable; falling back to main thread');
          worker = null;
        }
      }

      if (!worker) {
        try {
          const pattern = await fallbackGenerate(args);
          return pattern;
        } catch {
          setError('We could not convert that image.');
          throw new Error('We could not convert that image.');
        } finally {
          setBusy(false);
        }
      }

      return new Promise<PatternResult>((resolve, reject) => {
        pendingRef.current.set(requestId, { resolve, reject });

        const buffer = args.source.data.slice().buffer;
        const message: PatternWorkerRequest = {
          type: 'generate',
          requestId,
          width: args.width,
          height: args.height,
          brand: args.brand,
          denoiseLevel: args.denoiseLevel,
          removeBackground: args.removeBackground,
          autoCrop: args.autoCrop,
          pixels: buffer,
          sourceWidth: args.source.width,
          sourceHeight: args.source.height,
        };

        worker.postMessage(message, [buffer]);
      })
        .catch((cause: Error) => {
          setError(cause.message);
          throw cause;
        })
        .finally(() => {
          setBusy(false);
        });
    },
    [fallbackGenerate],
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  return { generate, busy, error };
};
