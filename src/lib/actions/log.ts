"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  applyXp,
  deriveNutrition,
  deriveSleep,
  deriveWorkout,
} from "@/lib/engines/pipeline";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  type AchievementSnapshot,
} from "@/lib/engines/achievements";
import { detectInsights } from "@/lib/engines/insights";
import type { WorkoutType } from "@/lib/types";

export type ActionResult =
  | { ok: true; message: string; xp: number; leveledUp: boolean; unlocked: string[] }
  | { ok: false; error: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  error: "Connect a Supabase project (set the env vars) to persist logs.",
};

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Shared tail of every action: apply an XP award, persist the profile/level
 * change, log the XP event, roll up daily_metrics, and evaluate achievements.
 */
async function commit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  award: { source: string; amount: number; reason: string },
  rollup: Partial<{ strain: number; readiness: number; sleepMin: number; calories: number; proteinG: number }>,
): Promise<{ xp: number; leveledUp: boolean; unlocked: string[] }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, current_streak, level")
    .eq("id", userId)
    .single();

  const previousTotal = profile?.total_xp ?? 0;
  const t = applyXp(previousTotal, award as never);

  await supabase
    .from("profiles")
    .update({ total_xp: t.totalXp, level: t.level })
    .eq("id", userId);

  await supabase.from("xp_events").insert({
    user_id: userId,
    source: award.source,
    amount: award.amount,
    reason: award.reason,
  });

  // Upsert today's rollup, accumulating XP earned.
  const { data: existing } = await supabase
    .from("daily_metrics")
    .select("xp_earned")
    .eq("user_id", userId)
    .eq("day", today())
    .maybeSingle();

  await supabase.from("daily_metrics").upsert(
    {
      user_id: userId,
      day: today(),
      xp_earned: (existing?.xp_earned ?? 0) + award.amount,
      ...rollup,
    },
    { onConflict: "user_id,day" },
  );

  const unlocked = await evaluateAndUnlock(supabase, userId, t.level, profile?.current_streak ?? 0);
  await refreshInsights(supabase, userId, t.level, t.totalXp);
  return { xp: award.amount, leveledUp: t.leveledUp, unlocked };
}

/**
 * Regenerate the proactive insight feed from the latest 30 days. We clear the
 * prior unacknowledged set and re-detect so the ticker always reflects current
 * signals rather than accumulating stale entries.
 */
async function refreshInsights(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  level: number,
  totalXp: number,
): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ data: metrics }, { data: sleep }] = await Promise.all([
    supabase
      .from("daily_metrics")
      .select("day, readiness, strain, sleep_min")
      .eq("user_id", userId)
      .gte("day", since.toISOString().slice(0, 10))
      .order("day", { ascending: true }),
    supabase
      .from("sleep_logs")
      .select("night_of, hrv_ms")
      .eq("user_id", userId)
      .gte("night_of", since.toISOString().slice(0, 10)),
  ]);

  if (!metrics || metrics.length < 3) return;
  const hrvByDay = new Map((sleep ?? []).map((s) => [s.night_of, s.hrv_ms]));

  const detected = detectInsights(
    metrics.map((m) => ({
      readiness: m.readiness,
      strain: m.strain != null ? Number(m.strain) : 0,
      sleepMin: m.sleep_min,
      hrvMs: hrvByDay.get(m.day) ?? 72,
    })),
    { level, totalXp },
  );

  await supabase.from("insights").delete().eq("user_id", userId).eq("acknowledged", false);
  if (detected.length > 0) {
    await supabase
      .from("insights")
      .insert(detected.map((d) => ({ user_id: userId, ...d })));
  }
}

async function evaluateAndUnlock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  level: number,
  currentStreak: number,
): Promise<string[]> {
  const [{ count: workouts }, { data: strainRows }, { count: nights }, { data: alreadyRows }] =
    await Promise.all([
      supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("workouts").select("strain").eq("user_id", userId),
      supabase
        .from("sleep_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("duration_min", 420),
      supabase.from("achievement_unlocks").select("achievement_key").eq("user_id", userId),
    ]);

  const snapshot: AchievementSnapshot = {
    totalWorkouts: workouts ?? 0,
    totalStrain: (strainRows ?? []).reduce((s, r) => s + (Number(r.strain) || 0), 0),
    currentStreak,
    level,
    nightsOver7h: nights ?? 0,
    proteinStreakDays: 0,
  };

  const already = new Set((alreadyRows ?? []).map((r) => r.achievement_key));
  const newly = evaluateAchievements(snapshot, already);
  if (newly.length === 0) return [];

  await supabase.from("achievement_unlocks").insert(
    newly.map((a) => ({ user_id: userId, achievement_key: a.key })),
  );
  return newly.map((a) => ACHIEVEMENTS.find((d) => d.key === a.key)?.name ?? a.key);
}

// ── Public actions ──────────────────────────────────────────────────────────

export async function logWorkout(input: {
  type: WorkoutType;
  title: string;
  durationMin: number;
  intensity: number;
  avgHr?: number;
}): Promise<ActionResult> {
  if (!configured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "You must be signed in." };

  const { strain, xp } = deriveWorkout({
    durationMin: input.durationMin,
    intensity: input.intensity,
    avgHr: input.avgHr,
  });

  const { error } = await supabase.from("workouts").insert({
    user_id: auth.user.id,
    type: input.type,
    title: input.title || null,
    duration_min: input.durationMin,
    intensity: input.intensity,
    avg_hr: input.avgHr ?? null,
    strain,
  });
  if (error) return { ok: false, error: error.message };

  const result = await commit(supabase, auth.user.id, xp, { strain });
  revalidatePath("/dashboard");
  revalidatePath("/training");
  return { ok: true, message: `Logged · +${result.xp} XP · strain ${strain.toFixed(1)}`, ...result };
}

export async function logSleep(input: {
  nightOf: string;
  durationMin: number;
  hrvMs?: number;
  restingHr?: number;
}): Promise<ActionResult> {
  if (!configured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "You must be signed in." };

  const { readiness, xp } = deriveSleep({
    sleepMin: input.durationMin,
    hrvMs: input.hrvMs,
    hrvBaselineMs: 72,
    restingHr: input.restingHr,
    restingHrBaseline: 51,
    recentStrain: 0,
  });

  const { error } = await supabase.from("sleep_logs").upsert(
    {
      user_id: auth.user.id,
      night_of: input.nightOf,
      duration_min: input.durationMin,
      hrv_ms: input.hrvMs ?? null,
      resting_hr: input.restingHr ?? null,
      readiness,
    },
    { onConflict: "user_id,night_of" },
  );
  if (error) return { ok: false, error: error.message };

  const result = await commit(supabase, auth.user.id, xp, { readiness, sleepMin: input.durationMin });
  revalidatePath("/dashboard");
  revalidatePath("/recovery");
  return { ok: true, message: `Logged · +${result.xp} XP · readiness ${readiness}`, ...result };
}

export async function logNutrition(input: {
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  proteinG: number;
}): Promise<ActionResult> {
  if (!configured()) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "You must be signed in." };

  const { xp } = deriveNutrition(
    { calories: input.calories, proteinG: input.proteinG },
    { calories: 2600, proteinG: 180 },
  );

  const { error } = await supabase.from("nutrition_logs").insert({
    user_id: auth.user.id,
    slot: input.slot,
    name: input.name || null,
    calories: input.calories,
    protein_g: input.proteinG,
  });
  if (error) return { ok: false, error: error.message };

  const result = await commit(supabase, auth.user.id, xp, {
    calories: input.calories,
    proteinG: input.proteinG,
  });
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { ok: true, message: `Logged · +${result.xp} XP`, ...result };
}
