'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils/cn';

export interface FaqEntry {
  question: string;
  answer: string;
  category: 'Generation' | 'Patterns' | 'Account' | 'Pricing' | 'Export';
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    category: 'Generation',
    question: 'Do I need an account to generate a pattern?',
    answer:
      'No. Uploading a photo and building a 58 × 58 pattern works without signing in. You only need an account for a Pro subscription, unlimited AI generations, or recovering your subscription on another device.',
  },
  {
    category: 'Generation',
    question: 'How many AI generations do I get for free?',
    answer:
      'Visitors get three AI generations per day. The limit is enforced on the server, so clearing browser storage will not reset it. Signing in keeps your daily allowance consistent across devices, and Pro removes the daily cap.',
  },
  {
    category: 'Generation',
    question: 'Why was my prompt refused?',
    answer:
      'Prompts are checked before generation and the image provider applies its own safety rules. If a request is blocked you will see a content policy message. Try a different description, and avoid naming characters or artwork you do not have permission to use.',
  },
  {
    category: 'Patterns',
    question: 'Which bead brands are supported?',
    answer:
      'The studio ships curated Perler and Artkal palettes with colour codes and names. Switch brands at any time; the pattern re-maps immediately and the shopping list updates with the new codes.',
  },
  {
    category: 'Patterns',
    question: 'What does the denoise level actually change?',
    answer:
      'Off keeps every matched bead. Light removes lone stray beads, Balanced also clears tiny two-bead flecks, and Strong is best for photos because it absorbs larger speckles into solid blocks. Higher levels mean fewer colour changes and faster placing.',
  },
  {
    category: 'Patterns',
    question: 'Can I swap one colour for another?',
    answer:
      'Yes. Select a colour in the preview or shopping list and pick a replacement from the closest matches. Counts update instantly and you can undo or reset any swap.',
  },
  {
    category: 'Pricing',
    question: 'What does Pro unlock?',
    answer:
      'Pro unlocks unlimited AI generations, 116 × 116 and larger boards, and printable high-resolution PDF charts. Shopping lists and 58 × 58 patterns stay free.',
  },
  {
    category: 'Account',
    question: 'How do I sign in without a password?',
    answer:
      'Use Google for one-tap sign-in, or enter your email to receive a single-use magic link. The link expires quickly and can only be used once, so nobody else can reuse it.',
  },
  {
    category: 'Account',
    question: 'Are my patterns saved in the cloud?',
    answer:
      'Not yet. Your five most recent projects stay in this browser so the studio stays fast and private. Cloud sync is not part of this release.',
  },
  {
    category: 'Export',
    question: 'Can I export anything on the free plan?',
    answer:
      'Yes. PNG export is free for any board inside your size limit — 58 × 58 on the free plan, larger boards on Pro. Printable PDF charts stay part of Pro, or you can unlock the PDF for one pattern with a single $1.99 payment.',
  },
  {
    category: 'Export',
    question: 'What is included in the printable PDF?',
    answer:
      'The PDF contains a clean grid with tiny colour codes printed in each cell, plus the full shopping list. It is sized for A4 and US Letter printing and is part of the Pro plan.',
  },
];

const CATEGORIES: Array<FaqEntry['category'] | 'All'> = [
  'All',
  'Generation',
  'Patterns',
  'Account',
  'Pricing',
  'Export',
];

export const FaqList = ({ compact = false }: { compact?: boolean }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FaqEntry['category'] | 'All'>('All');

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return FAQ_ENTRIES.filter((entry) => {
      const matchesCategory = category === 'All' || entry.category === category;
      const matchesQuery =
        needle.length === 0 ||
        entry.question.toLowerCase().includes(needle) ||
        entry.answer.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions about generation, patterns, pricing…"
            className="pl-11"
            aria-label="Search frequently asked questions"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition focus-ring',
                category === item
                  ? 'bg-ink text-cream'
                  : 'bg-white/80 text-ink-muted hover:bg-white hover:text-ink',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Accordion type="single" collapsible className={cn('mt-8 space-y-3', compact && 'mt-6')}>
        {entries.map((entry) => (
          <AccordionItem key={entry.question} value={entry.question}>
            <AccordionTrigger>{entry.question}</AccordionTrigger>
            <AccordionContent>{entry.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {entries.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-ink/15 bg-white/70 p-6 text-sm text-ink-muted">
          No questions matched “{query}”. Try another search or switch the category.
        </p>
      ) : null}
    </div>
  );
};
