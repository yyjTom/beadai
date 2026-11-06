'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, Crown, KeyRound, Loader2, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/hooks/useSession';
import { isAdminEmail } from '@/lib/adminEmails';

interface SubscriptionRow {
  provider: string;
  providerSubscriptionId: string;
  status: string;
  planKey: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
}

interface UnlockRow {
  patternHash: string;
  provider: string;
  createdAt: string;
}

interface UserView {
  found: boolean;
  user?: { id: string; email: string; createdAt: string; lastLoginAt: string | null };
  pro?: boolean;
  renewsAt?: string | null;
  aiUsedToday?: number;
  subscriptions?: SubscriptionRow[];
  unlocks?: UnlockRow[];
}

interface Overview {
  users: number;
  subscriptions: { total: number; active: number };
  unlocks: number;
  aiGenerationsToday: number;
  webhookEvents: Array<{
    eventType: string;
    eventId: string;
    receivedAt: string;
    processedAt: string | null;
    result: string | null;
  }>;
}

interface UserRow {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  pro: boolean;
  aiToday: number;
}

interface UserListData {
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : '—';

const postJson = async (url: string, body: unknown): Promise<Record<string, unknown>> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${response.status}`);
  }
  return data;
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl bg-cream-soft/70 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
    <p className="mt-1 text-xl font-bold text-ink">{value}</p>
  </div>
);

export const AdminDashboard = () => {
  const { session, loading } = useSession();
  const email = session?.user?.email ?? null;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [userList, setUserList] = useState<UserListData | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [userView, setUserView] = useState<UserView | null>(null);
  const [patternHash, setPatternHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      if (response.ok) setOverview((await response.json()) as Overview);
    } catch {
      // The overview card stays empty; the message row surfaces real failures.
    }
  }, []);

  const loadUsers = useCallback(async (query: string, page: number) => {
    setListLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?page=${page}&q=${encodeURIComponent(query)}`,
        { cache: 'no-store' },
      );
      if (response.ok) setUserList((await response.json()) as UserListData);
    } catch {
      // Keep the previous list; network hiccups are not worth a banner here.
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminEmail(email)) {
      void loadOverview();
      void loadUsers('', 1);
    }
  }, [email, loadOverview, loadUsers]);

  const lookup = useCallback(
    async (target: string) => {
      setBusy(true);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/admin/user?email=${encodeURIComponent(target)}`,
          { cache: 'no-store' },
        );
        const data = (await response.json()) as UserView & { error?: string };
        if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
        setUserView(data);
      } catch (cause) {
        setMessage({ tone: 'error', text: `Lookup failed: ${(cause as Error).message}` });
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const runAction = useCallback(
    async (action: () => Promise<string>) => {
      setBusy(true);
      setMessage(null);
      try {
        const text = await action();
        setMessage({ tone: 'ok', text });
        const current = userView?.user?.email ?? lookupEmail;
        if (current) await lookup(current);
        await loadOverview();
      } catch (cause) {
        setMessage({ tone: 'error', text: (cause as Error).message });
      } finally {
        setBusy(false);
      }
    },
    [loadOverview, lookup, lookupEmail, userView],
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-ink-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking access…
      </div>
    );
  }

  if (!session?.signedIn) {
    return (
      <div className="mx-auto max-w-md rounded-[2.5rem] border border-black/5 bg-white/85 p-10 text-center shadow-soft">
        <ShieldAlert className="mx-auto h-8 w-8 text-bead-violet" />
        <h1 className="mt-4 text-xl font-bold text-ink">Admin access</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Sign in with an administrator account to continue.
        </p>
        <Button asChild variant="primary" className="mt-6 w-full">
          <Link href="/login?next=/admin">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!isAdminEmail(email)) {
    return (
      <div className="mx-auto max-w-md rounded-[2.5rem] border border-black/5 bg-white/85 p-10 text-center shadow-soft">
        <ShieldAlert className="mx-auto h-8 w-8 text-state-danger" />
        <h1 className="mt-4 text-xl font-bold text-ink">Access denied</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {email} is not on the admin list. Ask an existing administrator to add this address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Admin</h1>
          <p className="mt-1 text-sm text-ink-muted">Signed in as {email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadOverview()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message ? (
        <p
          className={
            message.tone === 'ok'
              ? 'rounded-2xl bg-state-success/10 px-4 py-3 text-sm text-state-success'
              : 'rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger'
          }
        >
          {message.text}
        </p>
      ) : null}

      <section className="rounded-[2.5rem] border border-black/5 bg-white/85 p-6 shadow-soft sm:p-8">
        <h2 className="text-lg font-bold text-ink">Overview</h2>
        {overview ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat label="Users" value={overview.users} />
              <Stat
                label="Active subs"
                value={`${overview.subscriptions.active} / ${overview.subscriptions.total}`}
              />
              <Stat label="Pattern unlocks" value={overview.unlocks} />
              <Stat label="AI today" value={overview.aiGenerationsToday} />
            </div>

            <h3 className="mt-6 text-sm font-semibold text-ink">Recent webhooks</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Event</th>
                    <th className="py-2 pr-4 font-semibold">Received</th>
                    <th className="py-2 pr-4 font-semibold">Result</th>
                    <th className="py-2 font-semibold">Event ID</th>
                  </tr>
                </thead>
                <tbody className="text-ink">
                  {overview.webhookEvents.map((event) => (
                    <tr key={event.eventId} className="border-t border-black/5">
                      <td className="py-2 pr-4 font-semibold">{event.eventType}</td>
                      <td className="py-2 pr-4">{formatDate(event.receivedAt)}</td>
                      <td className="py-2 pr-4">{event.result ?? (event.processedAt ? 'ok' : 'pending')}</td>
                      <td className="max-w-[220px] truncate py-2 text-ink-muted">{event.eventId}</td>
                    </tr>
                  ))}
                  {overview.webhookEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-ink-muted">
                        No webhook events yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading stats…
          </p>
        )}
      </section>

      <section className="rounded-[2.5rem] border border-black/5 bg-white/85 p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Accounts</h2>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void loadUsers(listQuery, 1);
            }}
          >
            <Input
              value={listQuery}
              onChange={(event) => setListQuery(event.target.value)}
              placeholder="Search email…"
              type="search"
              aria-label="Search accounts"
              className="w-56"
            />
            <Button type="submit" size="sm" variant="outline" disabled={listLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-ink-muted">
              <tr>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Plan</th>
                <th className="py-2 pr-4 font-semibold">AI today</th>
                <th className="py-2 pr-4 font-semibold">Joined</th>
                <th className="py-2 font-semibold">Last login</th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {(userList?.users ?? []).map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-t border-black/5 hover:bg-cream-soft/60"
                  onClick={() => {
                    setLookupEmail(row.email);
                    void lookup(row.email);
                  }}
                  title="Open this account in the panel below"
                >
                  <td className="max-w-[240px] truncate py-2 pr-4 font-semibold">{row.email}</td>
                  <td className="py-2 pr-4">
                    {row.pro ? (
                      <Badge variant="violet">Pro</Badge>
                    ) : (
                      <Badge variant="neutral">Free</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-4">{row.aiToday}</td>
                  <td className="py-2 pr-4">{formatDate(row.createdAt)}</td>
                  <td className="py-2">{formatDate(row.lastLoginAt)}</td>
                </tr>
              ))}
              {userList && userList.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-ink-muted">
                    No accounts match that search.
                  </td>
                </tr>
              ) : null}
              {!userList ? (
                <tr>
                  <td colSpan={5} className="py-3 text-ink-muted">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading accounts…
                    </span>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {userList ? (
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
            <span>
              {userList.total} account(s) · page {userList.page} of{' '}
              {Math.max(1, Math.ceil(userList.total / userList.pageSize))}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={listLoading || userList.page <= 1}
                onClick={() => {
                  void loadUsers(listQuery, userList.page - 1);
                }}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={listLoading || userList.page >= Math.ceil(userList.total / userList.pageSize)}
                onClick={() => {
                  void loadUsers(listQuery, userList.page + 1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[2.5rem] border border-black/5 bg-white/85 p-6 shadow-soft sm:p-8">
        <h2 className="text-lg font-bold text-ink">Account</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void lookup(lookupEmail);
          }}
        >
          <Input
            value={lookupEmail}
            onChange={(event) => setLookupEmail(event.target.value)}
            placeholder="user@example.com"
            type="email"
            aria-label="User email"
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={busy || !lookupEmail}>
            <Search className="h-4 w-4" />
            Look up
          </Button>
        </form>

        {userView ? (
          userView.found && userView.user ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream-soft/70 p-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {userView.user.email}
                    {userView.pro ? (
                      <Badge variant="violet">Pro</Badge>
                    ) : (
                      <Badge variant="neutral">Free</Badge>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    id {userView.user.id} · joined {formatDate(userView.user.createdAt)} · last
                    login {formatDate(userView.user.lastLoginAt)} · AI today:{' '}
                    {userView.aiUsedToday ?? 0}
                    {userView.renewsAt ? ` · renews ${formatDate(userView.renewsAt)}` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Grant Pro
                </span>
                {(['1m', '12m', 'lifetime'] as const).map((duration) => (
                  <Button
                    key={duration}
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void runAction(async () => {
                        await postJson('/api/admin/grant', { email: userView.user!.email, duration });
                        return `Granted ${duration} Pro to ${userView.user!.email}`;
                      })
                    }
                  >
                    <Crown className="h-4 w-4" />
                    {duration === '1m' ? '1 month' : duration === '12m' ? '12 months' : 'Lifetime'}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      const data = await postJson('/api/admin/revoke', { email: userView.user!.email });
                      return `Revoked ${data.revoked ?? 0} admin grant(s) from ${userView.user!.email}. Dodo subscriptions must be cancelled in the Dodo dashboard.`;
                    })
                  }
                >
                  <Ban className="h-4 w-4" />
                  Revoke admin grants
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={patternHash}
                  onChange={(event) => setPatternHash(event.target.value)}
                  placeholder="Pattern hash (64 hex chars)"
                  aria-label="Pattern hash"
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || patternHash.trim().length !== 64}
                  onClick={() =>
                    void runAction(async () => {
                      const data = await postJson('/api/admin/unlock', {
                        email: userView.user!.email,
                        patternHash: patternHash.trim().toLowerCase(),
                      });
                      setPatternHash('');
                      return data.granted
                        ? `Unlocked pattern for ${userView.user!.email}`
                        : 'Pattern was already unlocked for this account';
                    })
                  }
                >
                  <KeyRound className="h-4 w-4" />
                  Unlock pattern
                </Button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Subscriptions</h3>
                  <ul className="mt-2 space-y-2 text-xs text-ink">
                    {(userView.subscriptions ?? []).map((row) => (
                      <li key={row.providerSubscriptionId} className="rounded-xl bg-cream-soft/60 p-3">
                        <span className="font-semibold">{row.provider}</span> · {row.planKey} ·{' '}
                        <span
                          className={
                            ['active', 'renewed', 'trialing'].includes(row.status)
                              ? 'text-state-success'
                              : 'text-ink-muted'
                          }
                        >
                          {row.status}
                        </span>
                        <span className="block text-ink-muted">
                          period end {formatDate(row.currentPeriodEnd)} · created{' '}
                          {formatDate(row.createdAt)}
                        </span>
                      </li>
                    ))}
                    {(userView.subscriptions ?? []).length === 0 ? (
                      <li className="text-ink-muted">No subscription rows.</li>
                    ) : null}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-ink">Pattern unlocks</h3>
                  <ul className="mt-2 space-y-2 text-xs text-ink">
                    {(userView.unlocks ?? []).map((row) => (
                      <li key={`${row.provider}-${row.patternHash}`} className="rounded-xl bg-cream-soft/60 p-3">
                        <span className="block truncate font-mono">{row.patternHash}</span>
                        <span className="text-ink-muted">
                          {row.provider} · {formatDate(row.createdAt)}
                        </span>
                      </li>
                    ))}
                    {(userView.unlocks ?? []).length === 0 ? (
                      <li className="text-ink-muted">No unlocks recorded.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-muted">
              No account found for that email. Accounts are created on first sign-in.
            </p>
          )
        ) : null}
      </section>
    </div>
  );
};
