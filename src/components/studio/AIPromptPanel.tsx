'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AI_ERROR_MESSAGES, type AiErrorCode } from '@/types/ai';
import { SAMPLE_PROMPTS } from '@/lib/marketing/gallery';
import { loadImageDataFromUrl, type LoadedImage } from '@/lib/utils/image';

const COOLDOWN_SECONDS = 5;

export const AIPromptPanel = ({
  onGenerated,
  remaining,
  unlimited,
  integrationsReady,
}: {
  onGenerated: (image: LoadedImage, prompt: string) => void;
  remaining: number | null;
  unlimited: boolean;
  integrationsReady: boolean;
}) => {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const generate = async () => {
    if (busy || cooldown > 0 || prompt.trim().length === 0) return;

    setBusy(true);
    setError(null);

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).catch(() => null);

    if (!response) {
      setBusy(false);
      setError(AI_ERROR_MESSAGES.server_error);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { image?: { dataUrl: string }; code?: AiErrorCode; message?: string }
      | null;

    if (!response.ok || !payload?.image?.dataUrl) {
      setBusy(false);
      setCooldown(COOLDOWN_SECONDS);
      setError(
        payload?.message ??
          AI_ERROR_MESSAGES[(payload?.code ?? 'server_error') as AiErrorCode] ??
          AI_ERROR_MESSAGES.server_error,
      );
      return;
    }

    try {
      const image = await loadImageDataFromUrl(payload.image.dataUrl);
      onGenerated(image, prompt);
      setCooldown(COOLDOWN_SECONDS);
    } catch (cause) {
      console.error('[ai-panel] could not read generated image', cause);
      setError('We could not read the generated image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const quotaLabel = unlimited
    ? 'Unlimited generations'
    : remaining === null
      ? 'AI unavailable'
      : `${remaining} free generations left today`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="violet">
          <Sparkles className="h-3.5 w-3.5" />
          AI inspiration generator
        </Badge>
        <span className="text-xs font-semibold text-ink-muted">{quotaLabel}</span>
      </div>

      <label htmlFor="ai-prompt" className="mt-5 block text-sm font-semibold text-ink">
        Describe the pixel art you want
      </label>
      <Textarea
        id="ai-prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        maxLength={400}
        placeholder="A retro 8-bit cyber-punk cat wearing sunglasses"
        className="mt-2 resize-none"
        disabled={busy}
      />

      <p className="mt-2 text-xs text-ink-muted">
        {prompt.length}/400 characters. Avoid naming characters or artwork you do not have rights to
        use.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLE_PROMPTS.slice(0, 3).map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => setPrompt(sample)}
            className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs text-ink transition hover:border-bead-violet hover:text-bead-violet focus-ring"
          >
            {sample}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="gradient"
        className="mt-6 w-full"
        onClick={() => void generate()}
        disabled={busy || cooldown > 0 || prompt.trim().length === 0 || !integrationsReady}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
        {busy
          ? 'Generating pixel art…'
          : cooldown > 0
            ? `Try again in ${cooldown}s`
            : 'Generate pixel art'}
      </Button>

      {!integrationsReady ? (
        <p className="mt-4 rounded-2xl bg-state-warning/10 px-4 py-3 text-xs text-ink">
          AI generation is not configured on this deployment yet. Upload a photo to keep building.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
};
