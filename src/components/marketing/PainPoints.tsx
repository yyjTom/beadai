import { Blocks, Palette, Ruler, ShoppingBasket } from 'lucide-react';

const PAIN_POINTS = [
  {
    icon: Ruler,
    title: 'Big pictures never fit',
    body: 'Generic pixel tools ignore pegboards, so your art comes out bigger than any board you own and impossible to plan.',
    tint: 'bg-bead-coral/12 text-bead-coral',
  },
  {
    icon: Blocks,
    title: 'Speckles everywhere',
    body: 'Random single beads make patterns painful to place. beadai merges stray pixels into solid, placeable blocks.',
    tint: 'bg-bead-amber/20 text-ink',
  },
  {
    icon: Palette,
    title: 'Colour codes are guesswork',
    body: 'Matching hundreds of Perler and Artkal shades by eye leads to wrong bags. Every pixel is matched in Lab colour space instead.',
    tint: 'bg-bead-sky/20 text-ink',
  },
  {
    icon: ShoppingBasket,
    title: 'Shopping takes forever',
    body: 'Counting beads by hand wastes an evening. The studio prints exact counts per colour plus handy buy links.',
    tint: 'bg-bead-violet/14 text-bead-violet',
  },
];

export const PainPoints = () => (
  <section className="container py-16" id="why-beadai">
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold text-ink sm:text-4xl">Built for real pegboards</h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">
        Four problems every serious bead artist hits, solved inside one browser studio.
      </p>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PAIN_POINTS.map((point) => (
        <article
          key={point.title}
          className="group rounded-3xl border border-black/5 bg-white/85 p-6 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift"
        >
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${point.tint}`}
          >
            <point.icon className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-ink">{point.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{point.body}</p>
        </article>
      ))}
    </div>
  </section>
);
