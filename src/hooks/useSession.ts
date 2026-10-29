'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EntitlementStatus, SessionResponse } from '@/types/entitlement';

export interface UseSessionResult {
  session: SessionResponse | null;
  entitlement: EntitlementStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const emptySession: SessionResponse = { signedIn: false, user: null };

export const useSession = (): UseSessionResult => {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [sessionResponse, entitlementResponse] = await Promise.all([
        fetch('/api/auth/session', { cache: 'no-store' }),
        fetch('/api/entitlement', { cache: 'no-store' }),
      ]);

      if (sessionResponse.ok) {
        setSession((await sessionResponse.json()) as SessionResponse);
      } else {
        setSession(emptySession);
      }

      if (entitlementResponse.ok) {
        setEntitlement((await entitlementResponse.json()) as EntitlementStatus);
      }
    } catch (error) {
      console.error('[useSession] failed to load session', error);
      setSession(emptySession);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[useSession] sign out failed', error);
    }
    setSession(emptySession);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, entitlement, loading, refresh, signOut };
};
