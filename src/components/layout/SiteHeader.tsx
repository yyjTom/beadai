'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/studio', label: 'Studio' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const { session, entitlement, loading, signOut } = useSession();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  const quotaLabel = () => {
    if (!entitlement) return null;
    if (entitlement.aiUnlimited) return 'Unlimited AI';
    if (entitlement.aiRemaining === null) return 'AI soon';
    return `${entitlement.aiRemaining} AI left today`;
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-cream/85 backdrop-blur-md">
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-full focus-ring">
          <span className="grid h-10 w-10 grid-cols-3 grid-rows-3 gap-0.5 rounded-2xl bg-ink p-1.5">
            {[...Array(9)].map((_, index) => (
              <span
                key={index}
                className="rounded-[3px]"
                style={{
                  background:
                    index % 4 === 0
                      ? '#FF6B6B'
                      : index % 4 === 1
                        ? '#FFB84C'
                        : index % 4 === 2
                          ? '#3BC9DB'
                          : '#7C5CFF',
                }}
              />
            ))}
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">beadai</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                isActive(link.href)
                  ? 'bg-ink text-cream'
                  : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {quotaLabel() ? (
            <Badge variant="sky" className="hidden sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {quotaLabel()}
            </Badge>
          ) : null}

          {loading ? (
            <span className="h-11 w-24 animate-pulse rounded-full bg-cream-soft" />
          ) : session?.signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-4 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 focus-ring"
                >
                  <UserRound className="h-4 w-4 text-bead-violet" />
                  <span className="max-w-[120px] truncate">{session.user?.email}</span>
                  {entitlement?.plan === 'pro' ? <Badge variant="violet">Pro</Badge> : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {entitlement?.plan === 'pro' ? 'Pro member' : 'Free plan'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">Manage subscription</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/pricing">View plans</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <Button asChild size="sm" variant="gradient">
            <Link href="/studio">Go to Studio</Link>
          </Button>

          {/* Below md the nav collapses, so every destination lives here. */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white text-ink shadow-soft transition focus-ring"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {entitlement?.plan === 'pro' ? 'Pro member' : 'Free plan'}
                  {quotaLabel() ? ` · ${quotaLabel()}` : ''}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {NAV_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {session?.signedIn ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account">Manage subscription</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void signOut()}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
