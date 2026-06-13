# Overseer OS — System Architecture

> Version 1.0 — a personal performance operating system.
> Track training, recovery, sleep, nutrition and goals; the Overseer
> intelligence layer turns that data into readiness, forecasts, XP, and
> proactive coaching.

This document is the architecture-first specification. It is written
**before** feature code and defines every system, how data flows between
them, and the dependency map that guarantees no feature operates in
isolation.

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                           │
│  App Router (RSC) · Design System · Component Library · Zustand    │
│  Dashboard · Training · Recovery · Nutrition · Coach · Analytics   │
└───────────────┬──────────────────────────────────┬────────────────┘
                │ server actions / fetch            │ realtime (ws)
┌───────────────▼──────────────┐      ┌─────────────▼────────────────┐
│      EDGE / API LAYER         │      │        SUPABASE               │
│  /api/coach  (AI streaming)   │      │  Postgres + RLS               │
│  /api/log    (ingest)         │◄────►│  Auth (JWT)                   │
│  server actions (mutations)   │      │  Storage (avatars/exports)    │
└───────┬───────────────┬───────┘      │  Realtime (row subscriptions) │
        │               │              └───────────────────────────────┘
        │               │
┌───────▼──────┐  ┌─────▼───────────────┐
│ INTELLIGENCE │  │  PERFORMANCE ENGINES │   (pure, deterministic TS)
│  Anthropic   │  │  XP · Readiness ·    │
│  Claude      │  │  Strain · Forecast · │
│ (Overseer AI)│  │  Achievements        │
└──────────────┘  └─────────────────────┘
```

### Frontend
- **Next.js 16 App Router** with React Server Components by default; client
  components only where interactivity is required (rings, charts, forms).
- **Design System** (`src/styles`) — tokens, typography, motion, surfaces.
- **Component Library** (`src/components/ui`) — atoms composed into modules.
- **State**: server state via RSC + Supabase; ephemeral UI state via Zustand.

### Backend
- **Supabase Postgres** as the system of record. Row Level Security isolates
  every user's data. Realtime subscriptions push live updates to the client.
- **API layer**: thin route handlers + server actions. The `/api/coach`
  route streams from the AI layer; ingestion endpoints validate and persist
  logs, then trigger the engines.

### Database
- Normalized relational schema (see `supabase/migrations/0001_init.sql`),
  designed for millions of users: UUID PKs, `user_id` FK + index on every
  table, partition-friendly time-series log tables, RLS on all tables.

### Authentication
- Supabase Auth (email magic-link + OAuth ready). JWT verified at the edge
  via `@supabase/ssr`; sessions stored in HTTP-only cookies. RLS policies key
  off `auth.uid()` so the database enforces tenancy, not just the app.

### Storage
- Supabase Storage buckets: `avatars` (public-read, owner-write) and
  `exports` (private). Signed URLs for downloads.

### AI architecture
- The **Overseer intelligence layer** is not a chatbot bolted on. It is a
  service (`src/lib/ai`) that reads the user's rolled-up state, runs the
  engines, and asks Claude (`claude-opus-4-8`) to analyze, detect risk,
  forecast, and recommend. It exposes:
  - `coach()` — conversational + proactive guidance (streaming).
  - `briefing()` — the daily intelligence briefing surfaced on the dashboard.
  - `insights()` — structured trend/risk/opportunity detection for tickers.

### Analytics architecture
- Engines compute derived metrics server-side and cache rollups in
  `daily_metrics`. The analytics module reads rollups (fast) rather than
  re-aggregating raw logs on every view.

---

## 2. Data Flow Architecture

Every primitive log flows through the same pipeline:

```
USER ──logs──▶ UI ──server action──▶ Postgres (raw log table)
                                          │
                                          ▼
                                   PERFORMANCE ENGINES
                    (strain · readiness · xp · forecast · achievements)
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                   daily_metrics     xp_events      achievements
                   (rollup cache)    (+ user level)  (unlocked)
                          │
                          ▼
        ┌─────────────────┴─────────────────────────────┐
        ▼                ▼               ▼               ▼
    DASHBOARD        ANALYTICS        FORECAST        AI COACH
   (rings/posters)   (charts)       (projection)   (reads it all)
```

The AI layer sits at the end of the flow: it consumes engine output, never
raw rows directly, so coaching is always consistent with the numbers shown.

---

## 3. Feature Dependency Map

No feature operates independently. Each primitive event fans out:

```
WORKOUT LOGGED
  → Training System        (record set/session)
  → Strain Engine          (compute session strain)
  → XP Engine              (+XP, level progress)
  → Achievement Engine     (volume/streak unlocks)
  → Forecast Engine        (update fitness trajectory)
  → daily_metrics rollup
  → Dashboard / Calendar / Analytics / AI Coach

SLEEP LOGGED
  → Recovery System        (sleep stages, duration)
  → Readiness Engine       (sleep + HRV + prior strain → readiness)
  → Forecast Engine        (recovery trajectory)
  → XP Engine              (consistency XP)
  → Dashboard / Analytics / AI Coach

NUTRITION LOGGED
  → Nutrition System       (macros, calories, hydration)
  → Readiness Engine       (fuel adequacy modifier)
  → XP Engine
  → Achievement Engine     (protein/streak unlocks)
  → Dashboard / Analytics / AI Coach

GOAL / HABIT CHECK-IN
  → Habit System           (streak)
  → XP Engine
  → Achievement Engine
  → Forecast Engine        (goal ETA projection)
  → Dashboard / AI Coach
```

---

## 4. Navigation Map

```
/                       → redirect to /dashboard (or /login)
/login                  → auth (magic link / OAuth)

(app shell: Sidebar + TopBar + Intelligence Ticker)
  /dashboard            → command center: readiness ring, metric posters,
                          daily AI briefing, intelligence ticker
  /training             → sessions, volume, strain, PRs
  /recovery             → sleep, HRV, readiness breakdown
  /nutrition            → calories, macros, hydration
  /coach                → Overseer AI (conversational + proactive)
  /analytics            → trends, correlations, charts
  /achievements         → XP, levels, unlocked achievements, streaks
  /calendar             → timeline of logs + planned sessions
  /settings             → profile, goals, integrations, account
```

---

## 5. Component Inventory

**Primitives (`components/ui`)**: `Button`, `Badge`, `Card`, `Ring`,
`StatDelta`, `Sparkline`, `ProgressBar`, `SectionHeader`, `Skeleton`.

**Layout (`components/layout`)**: `AppShell`, `Sidebar`, `TopBar`,
`PageHeader`.

**Modules (`components/modules`)**: `ReadinessRing`, `MetricPoster`,
`PosterGrid`, `IntelligenceTicker`, `DailyBriefing`, `XPLevelBar`,
`AchievementTile`, `LogDrawer`, `TrendChart`, `CoachThread`.

Pages assemble these components — no one-off UI.

---

## 6. API Architecture

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/coach` | POST | Stream Overseer AI coaching for a prompt + context |
| `/api/coach/briefing` | GET | Daily intelligence briefing (server-rendered) |
| `server action: logWorkout` | — | Persist workout → run engines |
| `server action: logSleep` | — | Persist sleep → readiness |
| `server action: logNutrition` | — | Persist nutrition → readiness/xp |
| `server action: checkInHabit` | — | Habit check-in → xp/streak |

All mutations validate input, write the raw log, then call the engine
pipeline (`src/lib/engines/pipeline.ts`) to update rollups, XP, and
achievements atomically.

---

## 7. AI Architecture (Overseer Intelligence Layer)

```
context = rollup(user_state) + engine_output(readiness, strain, forecast, xp)
            │
            ▼
   system prompt: "You are Overseer, the intelligence layer of a
   performance OS. Be precise, proactive, and grounded in the numbers."
            │
            ▼
   Claude (claude-opus-4-8) ──▶ { briefing, insights[], recommendations[] }
```

- **Grounded**: the model only sees engine-computed metrics, so advice never
  contradicts the dashboard.
- **Proactive**: `insights()` runs on rollup changes to populate the
  intelligence ticker with trends/risks/opportunities — not just on demand.
- **Streaming**: `/api/coach` streams tokens for a responsive thread.

See `src/lib/ai/overseer.ts`.

---

## 8. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | RSC, server actions, edge-ready |
| Language | TypeScript (strict) | Safety across engines + UI |
| Styling | Tailwind v4 + design tokens | One unified design language |
| State | Zustand (UI) + RSC (server) | Minimal client state |
| DB/Auth | Supabase (Postgres + RLS) | Scales, enforces tenancy in DB |
| AI | Anthropic Claude SDK | Overseer intelligence layer |
| Tests | Vitest | Deterministic engine coverage |
