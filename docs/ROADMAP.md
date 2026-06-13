# Overseer OS — Implementation Roadmap

Build order (architecture-first). ✅ = delivered in v1.0 foundation.

1. ✅ **Product & system architecture** — `docs/ARCHITECTURE.md`
2. ✅ **Database architecture** — `supabase/migrations/0001_init.sql`
   (normalized schema, FKs, indexes, constraints, RLS, realtime)
3. ✅ **Authentication architecture** — Supabase Auth + `@supabase/ssr`,
   middleware session refresh, RLS keyed on `auth.uid()`
4. ✅ **Design system** — tokens, typography, color, spacing, motion
   (`src/styles/globals.css`, `src/styles/tokens.css`)
5. ✅ **Core UI components** — Button, Card, Ring, Badge, Sparkline,
   ProgressBar, StatDelta, SectionHeader
6. ✅ **Navigation system** — AppShell, Sidebar, TopBar, intelligence ticker
7. ✅ **Dashboard framework** — readiness ring, metric posters, daily
   briefing, ticker
8. ✅ **Core feature modules** — Training, Recovery, Nutrition, Analytics,
   Achievements, Calendar, Coach, Settings
9. ✅ **AI systems** — Overseer intelligence layer (Claude), `/api/coach`
   streaming, daily briefing, proactive insights
10. ✅ **Analytics systems** — engine-computed rollups + trend charts
11. ⏳ **Integrations** — wearables (WHOOP/Oura/Apple Health), calendar,
    OpenFoodFacts. Adapters scaffolded; OAuth flows are post-v1.0.
12. ✅ **Testing** — Vitest coverage for the deterministic engines
13. ⏳ **Optimization** — RSC streaming + rollup caching in place; image/CDN
    and edge caching tuning is post-v1.0
14. ⏳ **Deployment** — Vercel + Supabase config documented in README

## Read path (delivered)

A unified data-access layer (`src/lib/data/queries.ts`) backs every page in
two transparent modes: **connected** (live, RLS-scoped Supabase rows mapped to
view models for a signed-in user) and **demo** (the seeded 30-day dataset).
Pages just `await getDays()` / `getProfile()` / `getInsights()` — identical in
both modes. Auth is completed end-to-end: magic-link `/auth/callback`
(PKCE + OTP) and a sign-out action.

## Write path (delivered)

Log forms (workout, sleep, meal) → server actions (`src/lib/actions/log.ts`)
→ persist raw log through RLS → engine **pipeline**
(`src/lib/engines/pipeline.ts`) fans out to strain/readiness/XP → updates
profile level, `xp_events`, `daily_metrics` rollup, and evaluates achievement
unlocks → `revalidatePath`. Falls back to a clear message until Supabase is
connected.

## Performance Engines (pure, deterministic, tested)

- **XP Engine** — XP awards per action, level curve, progress to next level.
- **Readiness Engine** — sleep + HRV + prior strain + fuel → 0–100 readiness.
- **Strain Engine** — session load from duration, intensity, heart-rate zones.
- **Forecast Engine** — EWMA trajectory + goal ETA projection.
- **Achievement Engine** — declarative achievement defs evaluated on rollups.
- **Insight Engine** — deterministic trend/risk/opportunity/milestone
  detection powering the intelligence ticker; regenerated and persisted after
  every log, and used as grounding for the AI layer.

## Definition of done (per feature)

- Persists to Postgres through RLS-protected mutations.
- Fans out through the engine pipeline (see dependency map).
- Renders with design-system components only.
- Surfaces in the AI layer's context.
