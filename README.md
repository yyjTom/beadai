# beadai.app

Turn any photo or idea into a printable fuse bead (Perler / Artkal) pattern with an exact shopping list.

- Next.js 15 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 3.4.17
- Client-side Web Worker + Canvas conversion, Lab colour matching, deterministic denoising
- Together AI text-to-pixel-art behind a protected server route
- Passwordless accounts: Google OAuth + Resend magic links
- Dodo Payments subscriptions with verified, idempotent webhooks
- PostgreSQL (via `DATABASE_URL`) for identity and subscriptions; Upstash Redis for quota, locks and rate limits

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything else degrades gracefully
npm run dev
```

The app builds and runs with **no credentials**. Missing integrations expose clear
`configuration-required` / disabled states instead of failing.

## Database migrations

Migrations are a separate step and never run during request handling or build:

```bash
npm run db:generate   # create SQL from src/lib/db/schema.ts
npm run db:migrate    # apply to DATABASE_URL
```

Tables: `users`, `auth_identities`, `magic_login_tokens`, `sessions`, `subscriptions`,
`webhook_events`, `daily_ai_usage`, `login_rate_buckets`, `feature_flags`.

## Environment variables

See `.env.example`. Server-only secrets must **never** use `NEXT_PUBLIC_`.

| Integration | Needs | Behaviour when missing |
| --- | --- | --- |
| Accounts & subscriptions | `DATABASE_URL`, `SESSION_SECRET` | Sign-in returns configuration-required; app still usable |
| Google login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Button reports not configured |
| Magic link email | `RESEND_API_KEY`, verified sender domain | Localhost returns a dev link; production reports failure |
| AI generation | `TOGETHER_API_KEY`, `TOGETHER_IMAGE_MODEL` | AI panel shows not configured |
| Quota & rate limits | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Falls back to PostgreSQL counters; rate limits log and allow |
| Payments | `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, product IDs | Checkout disabled, webhook rejects signatures |
| Shopping links | `AMAZON_ASSOCIATES_TAG` | Buy buttons show a neutral disabled state |

## Deploying to Vercel

1. Create the project and connect this repo; framework preset is **Next.js**.
2. Set environment variables for **Preview** and **Production** separately. Preview must keep `DODO_PAYMENTS_ENV=test`.
3. Add a pooled PostgreSQL connection string (`DATABASE_URL`). Neon, Supabase Postgres and Vercel Postgres all work.
4. Add Upstash Redis (Marketplace integration or direct REST credentials).
5. Run migrations once per environment: `npm run db:migrate`.
6. Register the Google OAuth redirect URI **exactly**:
   - `https://beadai.app/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` for local work
7. Verify your sending domain in Resend (SPF, DKIM, DMARC) and set `EMAIL_FROM`.
8. Point the Dodo webhook at `https://beadai.app/api/webhook/dodo` and copy the webhook key to `DODO_PAYMENTS_WEBHOOK_KEY`.
9. Set `NEXT_PUBLIC_SITE_URL=https://beadai.app` so callbacks, magic links and the sitemap use the canonical host.

`vercel.json` pins the AI route to a 60 second function duration and forces `no-store` on API responses. Adjust `maxDuration` if your Vercel plan allows a different ceiling.

## Security notes

- Google OAuth state is stored in a short-lived `HttpOnly` + `SameSite=Lax` cookie, compared in constant time, and cleared on every callback outcome. `next` accepts relative paths only.
- Magic links are 32 random bytes; only the hash is stored, the ticket is burned atomically before a session is issued, and the response never reveals whether a mailbox exists.
- Dodo webhooks are verified against the raw body with Standard Webhooks headers and a ±300s timestamp window. Every `event_id` is claimed once before processing.
- Entitlements are resolved server-side only. No query parameter or client state can grant Pro access.
- Anonymous AI usage is enforced server-side by cookie + IP + Redis; signing in merges usage instead of resetting it.

## Product boundaries

- No passwords, no cloud pattern storage, no 3D patterns, no admin dashboard.
- The five most recent projects stay in the visitor's browser.
- Colour swatches are curated approximations of brand charts; verify physical swatches for large orders.
