import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AccountPanel } from '@/components/auth/AccountPanel';

export const metadata: Metadata = {
  title: 'Account & access',
  description:
    'Manage your beadai subscription, check remaining AI generations, and confirm Pro access after payment.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <section className="container py-14">
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-[2.5rem] bg-white/60" />}>
        <AccountPanel />
      </Suspense>
    </section>
  );
}
