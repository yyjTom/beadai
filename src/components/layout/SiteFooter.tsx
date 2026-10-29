import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/studio', label: 'Studio' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#gallery', label: 'Pattern gallery' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/faq#generation', label: 'AI generation' },
      { href: '/faq#patterns', label: 'Pattern tips' },
      { href: '/account', label: 'Manage access' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/#faq', label: 'Support' },
      { href: '/faq#pricing', label: 'Billing help' },
      { href: '/studio', label: 'Try a photo' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

export const SiteFooter = () => (
  <footer className="mt-24 border-t border-black/5 bg-cream-soft/70">
    <div className="container py-14">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold text-ink">beadai</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Turn any photo or idea into a printable fuse bead pattern, complete with a precise
            shopping list for Perler and Artkal colours.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Some shopping links may earn beadai a commission at no extra cost to you. Colour
            swatches are planning approximations, so always check a physical bead chart before
            buying large quantities.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-ink">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition hover:text-bead-violet"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-black/5 pt-6 text-xs text-ink-muted sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p>© {new Date().getFullYear()} beadai.app — made for bead sprites and pixel makers.</p>
          <p className="mt-1">Patterns are generated in your browser. Projects stay on this device.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="transition hover:text-bead-violet">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-bead-violet">
            Terms
          </Link>
          <Link href="/faq" className="transition hover:text-bead-violet">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  </footer>
);
