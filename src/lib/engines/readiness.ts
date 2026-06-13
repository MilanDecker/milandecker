/**
 * Readiness Engine — a 0–100 score answering "how prepared is the body to
 * perform today?". Blends sleep, HRV, resting HR, and accumulated strain
 * against the user's own recent baselines.
 */

export interface ReadinessInput {
  sleepMin: number;
  /** Last-night HRV in ms, and the user's recent baseline. */
  hrvMs?: number;
  hrvBaselineMs?: number;
  restingHr?: number;
  restingHrBaseline?: number;
  /** Strain accumulated over the prior ~24–48h. */
  recentStrain?: number;
  /** 0..1 — how well fueled the user is (from nutrition engine). */
  fuel?: number;
}

export interface ReadinessResult {
  score: number;
  band: "low" | "moderate" | "primed";
  drivers: { label: string; contribution: number }[];
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  // Sleep: 8h is the reference; scaled 0..1 around it.
  const sleepScore = clamp(input.sleepMin / 480, 0, 1.1);

  // HRV: ratio to baseline, > 1 is good. Default to neutral when absent.
  const hrvScore =
    input.hrvMs != null && input.hrvBaselineMs
      ? clamp(input.hrvMs / input.hrvBaselineMs, 0.5, 1.25) / 1.25
      : 0.7;

  // Resting HR: lower than baseline is good (inverted).
  const rhrScore =
    input.restingHr != null && input.restingHrBaseline
      ? clamp(2 - input.restingHr / input.restingHrBaseline, 0.5, 1.2) / 1.2
      : 0.7;

  // Strain debt: high recent strain lowers readiness.
  const strainPenalty = clamp((input.recentStrain ?? 0) / 21, 0, 1);
  const recoveryScore = 1 - strainPenalty * 0.6;

  const fuelScore = clamp(input.fuel ?? 0.8, 0, 1);

  const weights = {
    sleep: 0.34,
    hrv: 0.26,
    rhr: 0.16,
    recovery: 0.16,
    fuel: 0.08,
  };

  const raw =
    sleepScore * weights.sleep +
    hrvScore * weights.hrv +
    rhrScore * weights.rhr +
    recoveryScore * weights.recovery +
    fuelScore * weights.fuel;

  const score = Math.round(clamp(raw, 0, 1) * 100);

  return {
    score,
    band: score >= 75 ? "primed" : score >= 50 ? "moderate" : "low",
    drivers: [
      { label: "Sleep", contribution: round(sleepScore * weights.sleep * 100) },
      { label: "HRV", contribution: round(hrvScore * weights.hrv * 100) },
      { label: "Resting HR", contribution: round(rhrScore * weights.rhr * 100) },
      { label: "Recovery", contribution: round(recoveryScore * weights.recovery * 100) },
      { label: "Fuel", contribution: round(fuelScore * weights.fuel * 100) },
    ],
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function round(n: number): number {
  return Math.round(n);
}
