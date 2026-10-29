'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EntitlementStatus } from '@/types/entitlement';

const SCHEDULE_MS = [0, 1_200, 2_500, 4_000, 6_000, 9_000];

export interface UseEntitlementPollingResult {
  status: EntitlementStatus | null;
  phase: 'checking' | 'active' | 'delayed' | 'failed';
  refresh: () => void;
}

/**
 * Bounded polling after a payment return. The webhook can arrive seconds later,
 * so the UI keeps checking for a short window instead of showing a stale
 * "Free" state to someone who just paid.
 */
export const useEntitlementPolling = (
  enabled: boolean,
  isActive: (status: EntitlementStatus) => boolean,
): UseEntitlementPollingResult => {
  const [status, setStatus] = useState<EntitlementStatus | null>(null);
  const [phase, setPhase] = useState<'checking' | 'active' | 'delayed' | 'failed'>('checking');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const run = useCallback(
    async (attempt: number) => {
      if (attempt >= SCHEDULE_MS.length) {
        setPhase((current) => (current === 'active' ? current : 'delayed'));
        return;
      }

      try {
        const response = await fetch('/api/entitlement', { cache: 'no-store' });
        if (!response.ok) throw new Error('entitlement request failed');
        const next = (await response.json()) as EntitlementStatus;
        setStatus(next);

        if (isActive(next)) {
          setPhase('active');
          return;
        }
      } catch (error) {
        console.error('[useEntitlementPolling] request failed', error);
      }

      const wait = SCHEDULE_MS[attempt + 1];
      if (wait === undefined) {
        setPhase('delayed');
        return;
      }

      attemptRef.current = attempt + 1;
      timerRef.current = setTimeout(() => void run(attempt + 1), wait);
    },
    [isActive],
  );

  const refresh = useCallback(() => {
    clearTimer();
    attemptRef.current = 0;
    setPhase('checking');
    void run(0);
  }, [run]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    return clearTimer;
  }, [enabled, refresh]);

  return { status, phase, refresh };
};
