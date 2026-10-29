import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudioWorkbench } from '@/components/studio/StudioWorkbench';

export const metadata: Metadata = {
  title: 'Bead studio',
  description:
    'Convert a photo or an AI-generated pixel image into a Perler or Artkal bead pattern with denoising, colour swap and an exact shopping list.',
};

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-[720px] animate-pulse rounded-[2.5rem] bg-white/60" />}>
      <StudioWorkbench />
    </Suspense>
  );
}
