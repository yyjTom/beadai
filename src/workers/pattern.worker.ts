/// <reference lib="webworker" />
import { generatePattern, type GeneratePatternInput } from '@/lib/pattern/generate';
import type { DenoiseLevel, PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

export interface PatternWorkerRequest {
  type: 'generate';
  requestId: string;
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
  removeBackground?: boolean;
  pixels: ArrayBuffer;
  sourceWidth: number;
  sourceHeight: number;
}

export type PatternWorkerResponse =
  | { type: 'done'; requestId: string; pattern: PatternResult }
  | { type: 'error'; requestId: string; message: string };

const post = (message: PatternWorkerResponse) => {
  self.postMessage(message);
};

self.onmessage = (event: MessageEvent<PatternWorkerRequest>) => {
  const message = event.data;
  if (!message || message.type !== 'generate') return;

  const { requestId } = message;

  try {
    const pattern = generatePattern({
      source: {
        width: message.sourceWidth,
        height: message.sourceHeight,
        data: new Uint8ClampedArray(message.pixels),
      },
      width: message.width,
      height: message.height,
      brand: message.brand,
      denoiseLevel: message.denoiseLevel,
      removeBackground: message.removeBackground,
    });

    post({ type: 'done', requestId, pattern });
  } catch (error) {
    console.error('[pattern-worker] generation failed', error);
    post({ type: 'error', requestId, message: 'We could not convert that image.' });
  }
};
