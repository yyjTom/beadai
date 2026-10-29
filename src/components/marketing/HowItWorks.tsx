import { Download, Grid3x3, Upload } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Bring a photo or an idea',
    body: 'Drop a PNG, JPG or WEBP up to 10MB, or let the AI generator draw pixel art from a short description.',
  },
  {
    icon: Grid3x3,
    title: 'Choose a board size',
    body: 'Pick 29 × 29 for one standard pegboard, 58 × 58 for four boards, or set a custom grid. Denoising keeps blocks clean.',
  },
  {
    icon: Download,
    title: 'Print the chart and shop',
    body: 'Export a printable grid with tiny colour codes and grab the exact shopping list for every colour you need.',
  },
];

export const HowItWorks = () => (
  <section className="container py-16" id="how-it-works">
    <div className="rounded-[2.5rem] border border-black/5 bg-white/80 p-8 shadow-soft sm:p-12">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-ink sm:text-4xl">Three steps to a finished sprite</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          No downloads, no account required to try. The heavy lifting happens right in your browser.
        </p>
      </div>

      <ol className="mt-10 grid gap-8 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-cream">
                <step.icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-bold uppercase tracking-widest text-ink-muted">
                Step {index + 1}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
