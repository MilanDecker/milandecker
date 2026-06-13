/**
 * Data-access layer — the single source of truth for reads.
 *
 * Two modes, transparent to callers:
 *  - Connected mode  (Supabase env set + a signed-in user with data): live,
 *    RLS-scoped rows mapped into the app's view models.
 *  - Demo mode       (no Supabase, or no data yet): the seeded 30-day dataset,
 *    where every derived number is still computed by the real engines.
 *
 * Pages stay identical across both modes — they just `await` these functions.
 */
import { createClient } from "@/lib/supabase/server";
import { forecast, type Forecast } from "@/lib/engines/forecast";
import {
  demoDays,
  demoInsights,
  demoProfile,
  type DemoDay,
} from "@/lib/demo-data";
import { levelProgress } from "@/lib/engines/xp";
import type { Insight, Profile } from "@/lib/types";

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Resolve the Supabase client + user, or null when in demo mode. */
async function authed() {
  if (!configured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

export interface DataSource {
  live: boolean;
}

export async function getProfile(): Promise<Profile & DataSource> {
  const ctx = await authed();
  if (!ctx) return { ...demoProfile, live: false };

  const { data } = await ctx.supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, level, total_xp, current_streak, longest_streak")
    .eq("id", ctx.userId)
    .single();

  if (!data) return { ...demoProfile, live: false };
  return {
    id: data.id,
    handle: data.handle,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    level: data.level,
    totalXp: data.total_xp,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    live: true,
  };
}

export async function getDays(days = 30): Promise<{ days: DemoDay[] } & DataSource> {
  const ctx = await authed();
  if (!ctx) return { days: demoDays, live: false };

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const [{ data: metrics }, { data: sleep }] = await Promise.all([
    ctx.supabase
      .from("daily_metrics")
      .select("day, readiness, strain, sleep_min, calories, protein_g, xp_earned")
      .eq("user_id", ctx.userId)
      .gte("day", sinceStr)
      .order("day", { ascending: true }),
    ctx.supabase
      .from("sleep_logs")
      .select("night_of, hrv_ms, resting_hr")
      .eq("user_id", ctx.userId)
      .gte("night_of", sinceStr),
  ]);

  if (!metrics || metrics.length === 0) return { days: demoDays, live: false };

  const sleepByDay = new Map((sleep ?? []).map((s) => [s.night_of, s]));
  const mapped: DemoDay[] = metrics.map((m) => {
    const s = sleepByDay.get(m.day);
    return {
      day: m.day,
      readiness: m.readiness,
      strain: m.strain != null ? Number(m.strain) : 0,
      sleepMin: m.sleep_min,
      calories: m.calories,
      proteinG: m.protein_g != null ? Number(m.protein_g) : 0,
      xpEarned: m.xp_earned,
      hrvMs: s?.hrv_ms ?? 72,
      restingHr: s?.resting_hr ?? 51,
    };
  });
  return { days: mapped, live: true };
}

export async function getInsights(): Promise<{ insights: Insight[] } & DataSource> {
  const ctx = await authed();
  if (!ctx) return { insights: demoInsights, live: false };

  const { data } = await ctx.supabase
    .from("insights")
    .select("id, kind, title, body, metric")
    .eq("user_id", ctx.userId)
    .eq("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!data || data.length === 0) return { insights: demoInsights, live: false };
  return { insights: data as Insight[], live: true };
}

// ── Derived aggregates (computed by the engines over whichever days we got) ──

export function weeklyStrainOf(days: DemoDay[]): number {
  return days.slice(-7).reduce((sum, d) => sum + (d.strain ?? 0), 0);
}

export function avgSleepOf(days: DemoDay[]): number {
  const last7 = days.slice(-7);
  if (last7.length === 0) return 0;
  return Math.round(last7.reduce((s, d) => s + (d.sleepMin ?? 0), 0) / last7.length);
}

export function readinessForecastOf(days: DemoDay[]): Forecast {
  return forecast(days.map((d) => d.readiness ?? 0), 14);
}

export { levelProgress };
