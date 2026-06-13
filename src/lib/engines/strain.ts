/**
 * Strain Engine — cardiovascular + muscular load of a session, on a 0–21
 * scale (WHOOP-style). Strain rises logarithmically with accumulated load so
 * that the back half of a hard session contributes less than the first half.
 */

export interface StrainInput {
  durationMin: number;
  /** Rating of perceived exertion, 0–10. */
  intensity?: number;
  /** Average heart rate during the session. */
  avgHr?: number;
  /** User max HR; defaults to an age-agnostic 190. */
  maxHr?: number;
}

const STRAIN_MAX = 21;

export function computeStrain(input: StrainInput): number {
  const duration = Math.max(0, input.durationMin);
  if (duration === 0) return 0;

  // Intensity factor 0..1 — prefer HR reserve when available, else RPE.
  let intensity: number;
  if (input.avgHr != null) {
    const maxHr = input.maxHr ?? 190;
    intensity = clamp(input.avgHr / maxHr, 0.4, 1);
  } else {
    intensity = clamp((input.intensity ?? 5) / 10, 0.2, 1);
  }

  // Raw load: minutes weighted by the cube of intensity (hard work counts more)
  const load = duration * Math.pow(intensity, 3);

  // Logarithmic compression onto the 0–21 scale.
  const strain = STRAIN_MAX * (1 - Math.exp(-load / 55));
  return round1(clamp(strain, 0, STRAIN_MAX));
}

/** A 0..1 "quality" signal for the XP engine derived from session strain. */
export function strainQuality(strain: number): number {
  return clamp(strain / 14, 0, 1);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
