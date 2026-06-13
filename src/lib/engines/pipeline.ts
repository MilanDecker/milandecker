/**
 * Engine pipeline — the single place where a raw log fans out into derived
 * state. Pure and deterministic so it can be unit-tested in isolation and
 * reused identically by every server action.
 *
 * See the feature dependency map in docs/ARCHITECTURE.md.
 */
import { awardXp, levelForXp, type XpAward } from "./xp";
import { computeStrain, strainQuality, type StrainInput } from "./strain";
import { computeReadiness, type ReadinessInput } from "./readiness";

export interface XpTransition {
  award: XpAward;
  totalXp: number;
  level: number;
  leveledUp: boolean;
}

/** Apply an XP award to a running total and recompute the level. */
export function applyXp(previousTotal: number, award: XpAward): XpTransition {
  const totalXp = previousTotal + award.amount;
  const previousLevel = levelForXp(previousTotal);
  const level = levelForXp(totalXp);
  return { award, totalXp, level, leveledUp: level > previousLevel };
}

export interface WorkoutDerived {
  strain: number;
  xp: XpAward;
}

/** Workout → strain (strain engine) → XP scaled by session quality. */
export function deriveWorkout(
  input: StrainInput,
  streakDays = 0,
): WorkoutDerived {
  const strain = computeStrain(input);
  return {
    strain,
    xp: awardXp("workout", {
      quality: strainQuality(strain),
      streakDays,
      reason: `Workout · strain ${strain.toFixed(1)}`,
    }),
  };
}

export interface SleepDerived {
  readiness: number;
  band: "low" | "moderate" | "primed";
  xp: XpAward;
}

/** Sleep → readiness (readiness engine) → consistency XP scaled by quality. */
export function deriveSleep(input: ReadinessInput, streakDays = 0): SleepDerived {
  const r = computeReadiness(input);
  return {
    readiness: r.score,
    band: r.band,
    xp: awardXp("sleep", {
      quality: r.score / 100,
      streakDays,
      reason: `Sleep · readiness ${r.score}`,
    }),
  };
}

export interface NutritionDerived {
  /** 0..1 fuel signal that feeds the readiness engine. */
  fuel: number;
  xp: XpAward;
}

/** Nutrition → fuel adequacy (vs targets) → XP. */
export function deriveNutrition(
  input: { calories: number; proteinG: number },
  targets: { calories: number; proteinG: number },
  streakDays = 0,
): NutritionDerived {
  const calRatio = clamp(input.calories / targets.calories, 0, 1.2);
  const proRatio = clamp(input.proteinG / targets.proteinG, 0, 1.2);
  const fuel = clamp((calRatio + proRatio) / 2, 0, 1);
  return {
    fuel,
    xp: awardXp("nutrition", {
      quality: fuel,
      streakDays,
      reason: `Nutrition · ${input.calories} kcal / ${input.proteinG}g protein`,
    }),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
