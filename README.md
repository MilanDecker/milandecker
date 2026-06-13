# Overseer OS

> Your personal performance operating system. Track training, recovery, sleep
> and nutrition; the **Overseer intelligence layer** turns that data into
> readiness, forecasts, XP, and proactive coaching.

A venture-quality, production-oriented v1.0 built greenfield with Next.js 16,
TypeScript, Tailwind v4, Supabase, and the Anthropic Claude SDK.

## What's inside

- **Architecture-first** — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
  and [`docs/ROADMAP.md`](docs/ROADMAP.md).
- **Performance engines** (`src/lib/engines`) — XP, Readiness, Strain,
  Forecast, Achievements. Pure, deterministic, unit-tested.
- **Overseer intelligence layer** (`src/lib/ai`) — Claude-powered briefings,
  proactive insights, and a grounded streaming coach (`/api/coach`).
- **Design system** (`src/app/globals.css`) — one unified, instrument-grade
  dark language; tokenized colors, typography, motion.
- **Component library** (`src/components`) — Ring, posters, ticker, charts,
  shell. Pages assemble components; no one-off UI.
- **Database** (`supabase/migrations/0001_init.sql`) — normalized, indexed,
  RLS on every table, realtime publication, seeded achievement catalog.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Anthropic keys (optional for demo)
npm run dev                  # http://localhost:3000
```

The app runs out of the box in **demo mode** — every number on the dashboard
is computed live by the real engines over a seeded 30-day dataset. Add
`ANTHROPIC_API_KEY` to light up the live Overseer briefing and coach; add the
Supabase keys and run the migration to persist real user data.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run test` | Run engine unit tests (Vitest) |
| `npm run typecheck` | Type-check the project |

## Deployment

Deploy the Next.js app to Vercel and point it at a Supabase project. Set the
environment variables from `.env.example` in your hosting provider. Run
`supabase/migrations/0001_init.sql` against your database (via the Supabase SQL
editor or CLI) to provision the schema, RLS, and seed data.
