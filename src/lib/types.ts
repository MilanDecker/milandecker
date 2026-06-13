/** Domain types shared across the app. Mirrors the Postgres schema. */

export type WorkoutType = "strength" | "cardio" | "mobility" | "sport" | "hiit" | "other";

export interface Profile {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  title: string | null;
  startedAt: string;
  durationMin: number;
  avgHr: number | null;
  intensity: number | null;
  strain: number | null;
  volumeKg: number | null;
}

export interface SleepLog {
  id: string;
  nightOf: string;
  durationMin: number;
  deepMin: number;
  remMin: number;
  hrvMs: number | null;
  restingHr: number | null;
  efficiency: number | null;
  readiness: number | null;
}

export interface NutritionLog {
  id: string;
  eatenAt: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  name: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  hydrationMl: number | null;
}

export interface DailyMetric {
  day: string;
  readiness: number | null;
  strain: number | null;
  sleepMin: number | null;
  calories: number | null;
  proteinG: number | null;
  xpEarned: number;
}

export type InsightKind = "trend" | "risk" | "opportunity" | "milestone";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string | null;
  metric: string | null;
}
