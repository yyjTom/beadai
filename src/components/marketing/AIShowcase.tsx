import Link from 'next/link';
import { ArrowRight, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SAMPLE_PROMPTS } from '@/lib/marketing/gallery';

const PIPELINE = [
  { label: 'Prompt', detail: 'Describe the sprite you want in plain English.' },
  { label: 'Pixel art', detail: 'A pixel-style image is generated for you.' },
  { label: 'Bead pattern', detail: 'Colours snap to real bead codes and get denoised.' },
];

export const AIShowcase = () => (
  <section className="container py-16" id="ai-generator">
    <div className="relative overflow-hidden rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-white via-cream to-cream-soft p-8 shadow-lift sm:p-12">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-bead-violet/15 blur-3xl" />
      <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-bead-sky/20 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge variant="violet">
            <Wand2 className="h-3.5 w-3.5" />
            AI inspiration generator
          </Badge>
          <h2 className="mt-5 text-3xl font-bold text-ink sm:text-4xl">
            No artwork handy? Describe it instead
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Type a short prompt, get pixel-style art, and watch it become a bead chart with real
            Perler and Artkal codes. Guests get three generations per day; Pro members get unlimited
            generations plus large boards and printable PDFs.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.slice(0, 3).map((prompt) => (
              <span
                key={prompt}
                className="rounded-full border border-ink/10 bg-white/90 px-4 py-2 text-xs font-medium text-ink"
              >
                {prompt}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="gradient" size="lg">
              <Link href="/studio?source=ai">
                Try the AI generator
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/pricing">See what Pro unlocks</Link>
            </Button>
          </div>

          <p className="mt-6 inline-flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-state-success" />
            Prompts are checked before generation and unsafe requests are refused with a clear
            message. Please avoid describing characters or artwork you do not have rights to use.
          </p>
        </div>

        <ol className="relative space-y-4">
          {PIPELINE.map((step, index) => (
            <li
              key={step.label}
              className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-cream">
                  {index + 1}
                </span>
                <p className="text-base font-semibold text-ink">{step.label}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);
