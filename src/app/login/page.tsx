import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginCard } from '@/components/auth/LoginCard';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to beadai with Google or a single-use email link. No passwords, and no account is needed to try a 29 × 29 pattern.',
};

export default function LoginPage() {
  return (
    <section className="container py-14">
      <Suspense fallback={<div className="h-[560px] animate-pulse rounded-[2.5rem] bg-white/60" />}>
        <LoginCard />
      </Suspense>
    </section>
  );
}
