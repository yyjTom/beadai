'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PixelArt } from '@/components/layout/PixelArt';
import { HERO_ART } from '@/lib/marketing/gallery';

const GOOGLE_REASONS: Record<string, string> = {
  unconfigured: 'Google sign-in is not configured on this deployment yet.',
  state_missing:
    'That sign-in session expired. Please start again — if it keeps happening, try another browser or allow cookies for this site.',
  state_mismatch: 'We could not verify the sign-in request. Please try again.',
  denied: 'Google sign-in was cancelled.',
  no_code: 'Google did not return an authorization code.',
  token_failed: 'We could not complete the Google exchange.',
  profile_failed: 'We could not read your Google profile.',
  unverified_email: 'That Google account does not have a verified email address.',
  server_misconfigured: 'Sign-in is missing server configuration.',
};

const MAGIC_REASONS: Record<string, string> = {
  invalid: 'That sign-in link is not valid.',
  used: 'That sign-in link was already used. Request a new one.',
  expired: 'That sign-in link expired. Request a new one.',
  not_configured: 'Sign-in is not configured on this deployment yet.',
};

export const LoginCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/studio';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const googleReason = searchParams.get('google');
  const magicReason = searchParams.get('magic');

  const startGoogle = () => {
    window.location.href = `/api/auth/google/start?next=${encodeURIComponent(next)}`;
  };

  const sendMagicLink = async () => {
    if (status === 'sending' || cooldown > 0) return;

    setStatus('sending');
    setError(null);
    setMessage(null);

    const response = await fetch('/api/auth/magic/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const payload = (await response?.json().catch(() => null)) as { message?: string } | null;
      setStatus('idle');
      setError(payload?.message ?? 'We could not send the sign-in link.');
      return;
    }

    const payload = (await response.json()) as { devUrl?: string; message?: string };
    setStatus('sent');
    setMessage(payload.devUrl ?? payload.message ?? null);
    setCooldown(30);

    const timer = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  return (
    <div className="grid overflow-hidden rounded-[2.5rem] border border-black/5 bg-white/90 shadow-lift lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden flex-col justify-between bg-cream-soft p-10 lg:flex">
        <div>
          <PixelArt
            rows={HERO_ART.rows}
            palette={HERO_ART.palette}
            gap={5}
            className="w-full max-w-[240px]"
          />
          <h2 className="mt-8 text-2xl font-bold text-ink">Sign in only when it helps</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Converting a photo to a 58 × 58 pattern stays free without an account. Sign in to keep
            Pro access, get unlimited AI generations, and recover your subscription on any device.
          </p>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-ink-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-state-success" />
            No passwords, ever — links work once and expire quickly.
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-bead-violet" />
            Pro unlocks unlimited AI ideas, 116 × 116 boards and printable PDFs.
          </li>
        </ul>
      </div>

      <div className="p-8 sm:p-12">
        <Badge variant="violet">Welcome back</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink">Sign in to beadai</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Use Google for one-tap access, or get a single-use link by email.
        </p>

        {googleReason ? (
          <p className="mt-6 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
            {GOOGLE_REASONS[googleReason] ?? 'Google sign-in did not complete.'}
          </p>
        ) : null}

        {magicReason ? (
          <p className="mt-4 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
            {MAGIC_REASONS[magicReason] ?? 'That sign-in link could not be used.'}
          </p>
        ) : null}

        <button
          type="button"
          onClick={startGoogle}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3.5 text-base font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift focus-ring"
        >
          <Image
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            width={20}
            height={20}
            unoptimized
          />
          Continue with Google
        </button>

        <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-widest text-ink-muted">
          <span className="h-px flex-1 bg-ink/10" />
          or
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <label htmlFor="magic-email" className="text-sm font-semibold text-ink">
          Email me a sign-in link
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Input
            id="magic-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === 'sending'}
          />
          <Button
            type="button"
            onClick={() => void sendMagicLink()}
            disabled={status === 'sending' || cooldown > 0 || email.trim().length === 0}
            className="sm:w-auto"
          >
            {status === 'sending' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="h-4 w-4" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send link'}
          </Button>
        </div>

        {status === 'sent' ? (
          <div className="mt-5 rounded-2xl bg-state-success/10 p-4 text-sm text-ink">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1 leading-relaxed text-ink-muted">
              {message ?? 'If that address can receive mail, a single-use sign-in link is on its way.'}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
            {error}
          </p>
        ) : null}

        <p className="mt-8 text-xs leading-relaxed text-ink-muted">
          Your patterns stay on this device. Signing in only stores your account, subscription and
          quota state so Pro access follows you.
        </p>

        <button
          type="button"
          onClick={() => router.push('/studio')}
          className="mt-6 text-sm font-semibold text-bead-violet hover:underline"
        >
          Continue without signing in
        </button>

        <p className="mt-4 text-xs text-ink-muted">
          Need help? Read the <Link href="/faq" className="underline">FAQ</Link> or{' '}
          <Link href="/pricing" className="underline">compare plans</Link>.
        </p>
      </div>
    </div>
  );
};
