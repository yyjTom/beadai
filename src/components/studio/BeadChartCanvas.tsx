'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { fitCellSize, paintBeadChart } from '@/lib/render/beadChart';
import { cn } from '@/lib/utils/cn';
import type { PaletteBrand, PatternResult } from '@/types/pattern';

interface BeadChartCanvasProps {
  pattern: PatternResult;
  brand: PaletteBrand;
  showGrid?: boolean;
  showCodes?: boolean;
  minCellSize?: number;
  maxCellSize?: number;
  className?: string;
}

/**
 * Read-only chart painter for surfaces that just need to show the pattern
 * (the homepage preview). The studio keeps its interactive canvas so hovering
 * and colour picking stay intact.
 */
export const BeadChartCanvas = memo(
  ({
    pattern,
    brand,
    showGrid = true,
    showCodes = false,
    minCellSize = 3,
    maxCellSize = 22,
    className,
  }: BeadChartCanvasProps) => {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameRef = useRef<number | null>(null);
    const [hostWidth, setHostWidth] = useState(0);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      // Guard against SSR: ResizeObserver only exists in the browser, and this
      // effect never runs on the server.
      setHostWidth(host.clientWidth);

      const observer = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect.width ?? 0;
        setHostWidth((previous) => (Math.abs(previous - next) < 1 ? previous : next));
      });
      observer.observe(host);
      return () => observer.disconnect();
    }, []);

    const cellSize = useMemo(() => {
      if (hostWidth <= 0) return 0;
      return fitCellSize(hostWidth, pattern.width, showGrid, {
        min: minCellSize,
        max: maxCellSize,
      });
    }, [hostWidth, pattern.width, showGrid, minCellSize, maxCellSize]);

    useEffect(() => {
      if (cellSize <= 0) return;

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

      // Coalesce back-to-back layout changes into a single repaint.
      frameRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = pattern.width * cellSize;
        const height = pattern.height * cellSize;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        paintBeadChart(ctx, { pattern, brand, cellSize, showGrid, showCodes });
      });

      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }, [pattern, brand, cellSize, showGrid, showCodes]);

    return (
      <div ref={hostRef} className={cn('mx-auto w-full', className)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${pattern.width} by ${pattern.height} bead chart with ${pattern.distinctColors} colours and ${pattern.totalBeads} beads`}
          className="mx-auto block rounded-xl"
        />
      </div>
    );
  },
);

BeadChartCanvas.displayName = 'BeadChartCanvas';
