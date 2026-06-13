/**
 * Deterministic demo dataset. Until a Supabase project is connected, the app
 * renders a realistic athlete's last 30 days — and crucially, every derived
 * number (strain, readiness, XP, forecast) is computed by the real engines,
 * not hard-coded. This is the same data shape the live queries will return.
 */
import { computeStrain } from "./engines/strain";
import { computeReadiness } from "./engines/readiness";
import { levelProgress } from "./engines/xp";
import { forecast } from "./engines/forecast";
import type { DailyMetric, Insight, Profile } from "./types";

// Seeded PRNG for stable output across renders/builds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(7);
const DAYS = 30;

export interface DemoDay extends DailyMetric {
  hrvMs: number;
  restingHr: number;
}

function buildDays(): DemoDay[] {
  const days: DemoDay[] = [];
  const hrvBaseline = 72;
  const rhrBaseline = 51;

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const trained = rand() > 0.32;
    const sleepMin = Math.round(380 + rand() * 130);
    const hrvMs = Math.round(hrvBaseline + (rand() - 0.5) * 22 + (DAYS - i) * 0.2);
    const restingHr = Math.round(rhrBaseline + (rand() - 0.5) * 6);

    const strain = trained
      ? computeStrain({
          durationMin: 35 + Math.round(rand() * 55),
          intensity: 4 + rand() * 5,
        })
      : 0;

    const readiness = computeReadiness({
      sleepMin,
      hrvMs,
      hrvBaselineMs: hrvBaseline,
      restingHr,
      restingHrBaseline: rhrBaseline,
      recentStrain: strain,
      fuel: 0.75 + rand() * 0.2,
    }).score;

    const calories = Math.round(2100 + rand() * 700);
    const proteinG = Math.round(120 + rand() * 80);
    const xpEarned = (trained ? 60 : 0) + 30 + Math.round(rand() * 20);

    days.push({
      day: d.toISOString().slice(0, 10),
      readiness,
      strain,
      sleepMin,
      calories,
      proteinG,
      xpEarned,
      hrvMs,
      restingHr,
    });
  }
  return days;
}

export const demoDays = buildDays();

export const demoProfile: Profile = (() => {
  const totalXp = demoDays.reduce((sum, d) => sum + d.xpEarned, 0) + 6400;
  const lp = levelProgress(totalXp);
  return {
    id: "demo",
    handle: "operator",
    displayName: "Operator",
    avatarUrl: null,
    level: lp.level,
    totalXp,
    currentStreak: 12,
    longestStreak: 21,
  };
})();

export const today = demoDays.at(-1)!;

export const readinessForecast = forecast(
  demoDays.map((d) => d.readiness ?? 0),
  14,
);

export const weeklyStrain = demoDays
  .slice(-7)
  .reduce((sum, d) => sum + (d.strain ?? 0), 0);

export const demoInsights: Insight[] = [
  {
    id: "1",
    kind: "trend",
    title: "HRV trending up 8% over 14 days",
    body: "Your autonomic recovery is improving — capacity for higher load.",
    metric: "hrv",
  },
  {
    id: "2",
    kind: "risk",
    title: "Sleep debt building",
    body: "3 of the last 5 nights under 6.5h. Readiness is starting to dip.",
    metric: "sleep",
  },
  {
    id: "3",
    kind: "opportunity",
    title: "Primed for a hard session",
    body: "Readiness is in the top band with low recent strain. Push today.",
    metric: "readiness",
  },
  {
    id: "4",
    kind: "milestone",
    title: "4 days from Level " + (demoProfile.level + 1),
    body: "Maintain your streak to reach the next level by the weekend.",
    metric: "xp",
  },
];
