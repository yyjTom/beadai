import type { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What beadai collects, why it collects it, which third parties process it, and how to ask for your data to be deleted.',
};

const UPDATED = '30 October 2026';

const SECTIONS = [
  {
    id: 'summary',
    heading: 'The short version',
    paragraphs: [
      'Photos you turn into bead patterns are processed inside your browser. The image itself is never uploaded to our servers and is never stored.',
      'We only collect what is needed to run an account: your email address, a record of your sign-in, and how many AI generations you have used today. We do not sell data, and we do not run advertising trackers.',
    ],
  },
  {
    id: 'what-we-collect',
    heading: 'What we collect',
    paragraphs: [
      'Account data: your email address, and for Google sign-in the account identifier Google returns plus whether that address is verified. For email sign-in we store a one-way hash of the single-use login token, never the token itself.',
      'Session data: a hashed form of your IP address and browser user agent, used to detect stolen sessions and to apply rate limits. We do not store raw IP addresses.',
      'Usage data: an anonymous key stored in your browser plus a hashed IP, used to apply the daily AI generation limit for visitors who are not signed in.',
      'Prompt data: if you use AI generation, the text prompt you type is sent to our image provider so it can produce an image. Prompts are not published and are not used to train anything on our side.',
      'Subscription data: our payment processor handles card details. We store only the resulting subscription status, plan and renewal date.',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies and local storage',
    paragraphs: [
      'We set a session cookie to keep you signed in. It is HTTP-only and marked secure on the live site. A short-lived cookie is also used during Google sign-in to protect against request forgery, and it is deleted as soon as the sign-in finishes.',
      'A small local key is kept in browser storage so that visitors who are not signed in still get a fair daily AI allowance. Clearing site data resets it.',
    ],
  },
  {
    id: 'third-parties',
    heading: 'Who processes data on our behalf',
    paragraphs: [
      'Database and hosting: our Postgres database provider stores accounts, sessions and subscription records; the site itself runs on our hosting platform.',
      'Email delivery: one-time sign-in links are delivered by our transactional email provider.',
      'Image generation: AI prompts are sent to our image model provider.',
      'Payments: subscriptions are processed by our payment provider, which is the only party that handles card data.',
      'Shopping links: some bead shopping links are affiliate links. Following one may set a cookie on the retailer’s own site, which we do not control.',
    ],
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    paragraphs: [
      'Account and subscription records are kept while your account exists. Sign-in sessions expire and are cleaned up automatically. Expired login tokens and rate-limit counters are short-lived and removed on a rolling basis.',
    ],
  },
  {
    id: 'your-rights',
    heading: 'Your choices',
    paragraphs: [
      'You can ask for a copy of the data tied to your account, or ask us to delete your account and its records. Email us and we will action it. Deleting your account removes your entitlement, subscription record and session history from our database.',
      'You can stop AI generation, clear your browser storage, or simply not sign in — the pattern tool itself works without an account.',
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    paragraphs: [
      'beadai is a general-audience craft tool. It is not directed at children under 13, and we do not knowingly collect accounts from them.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    paragraphs: [
      'If this policy changes in a way that affects how your data is handled, we will update the date below and, where it is material, say so on the site.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="container pt-14 pb-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-ink sm:text-5xl">Privacy policy</h1>
        <p className="mt-4 text-sm text-ink-muted">Last updated {UPDATED}</p>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          Your photos stay on your device. Everything else we hold is the minimum needed to keep your
          account, your subscription and your daily AI allowance working.
        </p>
      </div>

      <div className="mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 className="text-xl font-bold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-muted">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-3xl rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-soft">
        <h2 className="text-xl font-bold text-ink">Questions or deletion requests</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Email {env.supportEmail} and we will help. For anything about billing, our{' '}
          <Link href="/faq#pricing" className="font-semibold text-bead-violet hover:underline">
            billing FAQ
          </Link>{' '}
          answers the common cases first.
        </p>
      </div>
    </section>
  );
}
