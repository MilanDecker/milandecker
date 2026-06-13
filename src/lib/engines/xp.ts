/**
 * XP Engine — gamification core.
 *
 * Levels follow a smooth quadratic curve so early progress feels fast and
 * later levels demand sustained consistency. The curve is the single source
 * of truth for both "XP needed for a level" and "level for a given XP".
 */

/** Total cumulative XP required to *reach* a given level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 100 * (n-1)^2 + 50 * (n-1)  →  L2=150, L3=400, L4=750, L10=8550
  const n = level - 1;
  return 100 * n * n + 50 * n;
}

/** The level a user is at given their total accumulated XP. */
export function levelForXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** 0..1 progress toward the next level. */
  progress: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const into = totalXp - floor;
  return {
    level,
    totalXp,
    xpIntoLevel: into,
    xpForNextLevel: span,
    progress: span === 0 ? 0 : Math.min(1, into / span),
  };
}

export type XpSource = "workout" | "sleep" | "nutrition" | "habit" | "goal" | "achievement";

/** Base XP awarded per action, before multipliers. */
const BASE_XP: Record<XpSource, number> = {
  workout: 60,
  sleep: 30,
  nutrition: 20,
  habit: 10,
  goal: 200,
  achievement: 0, // achievements carry their own reward
};

export interface XpAward {
  source: XpSource;
  amount: number;
  reason: string;
}

/**
 * Award XP for an action. `quality` (0..1) scales the reward — e.g. a hard
 * workout or a full night of sleep earns the full base, a light one less.
 * `streakDays` applies a consistency multiplier capped at 1.5x.
 */
export function awardXp(
  source: XpSource,
  opts: { quality?: number; streakDays?: number; reason?: string } = {},
): XpAward {
  const quality = clamp(opts.quality ?? 1, 0, 1);
  const streakMult = 1 + Math.min(0.5, (opts.streakDays ?? 0) * 0.02);
  const amount = Math.round(BASE_XP[source] * (0.5 + 0.5 * quality) * streakMult);
  return { source, amount, reason: opts.reason ?? `${source} logged` };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
