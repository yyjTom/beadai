'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

export const SubscribeButton = ({
  plan,
  next,
  children,
  ...props
}: { plan: 'pro-monthly' | 'pro-yearly'; next?: string } & ButtonProps) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setPending(true);
    setError(null);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    }).catch(() => null);

    const payload = (await response?.json().catch(() => null)) as
      | { ok?: boolean; checkoutUrl?: string; code?: string; message?: string }
      | null;

    if (!response || !payload?.ok || !payload.checkoutUrl) {
      setPending(false);

      if (payload?.code === 'unauthorized') {
        const target = next ? `/login?next=${encodeURIComponent(next)}` : '/login?next=/pricing';
        router.push(target);
        return;
      }

      setError(payload?.message ?? 'Checkout could not start. Please try again.');
      return;
    }

    window.location.href = payload.checkoutUrl;
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        onClick={() => void startCheckout()}
        disabled={pending}
        className="w-full"
        {...props}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </Button>
      {error ? <p className="mt-3 text-sm text-state-danger">{error}</p> : null}
    </div>
  );
};
