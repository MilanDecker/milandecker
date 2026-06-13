/**
 * Achievement Engine — declarative achievement catalog evaluated against a
 * snapshot of the user's aggregate state. Adding an achievement is a matter
 * of adding a definition; the evaluator stays unchanged.
 */

export interface AchievementSnapshot {
  totalWorkouts: number;
  totalStrain: number;
  currentStreak: number;
  level: number;
  nightsOver7h: number;
  proteinStreakDays: number;
}

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  tier: "bronze" | "silver" | "gold";
  xpReward: number;
  predicate: (s: AchievementSnapshot) => boolean;
  /** 0..1 progress toward unlocking, for the UI. */
  progress: (s: AchievementSnapshot) => number;
}

const pct = (value: number, target: number) =>
  Math.max(0, Math.min(1, value / target));

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_workout",
    name: "First Blood",
    description: "Log your first workout.",
    tier: "bronze",
    xpReward: 50,
    predicate: (s) => s.totalWorkouts >= 1,
    progress: (s) => pct(s.totalWorkouts, 1),
  },
  {
    key: "week_streak_7",
    name: "Consistency",
    description: "Maintain a 7-day streak.",
    tier: "silver",
    xpReward: 150,
    predicate: (s) => s.currentStreak >= 7,
    progress: (s) => pct(s.currentStreak, 7),
  },
  {
    key: "strain_marathon",
    name: "Iron Will",
    description: "Accumulate 100 total strain.",
    tier: "gold",
    xpReward: 300,
    predicate: (s) => s.totalStrain >= 100,
    progress: (s) => pct(s.totalStrain, 100),
  },
  {
    key: "early_riser",
    name: "Early Riser",
    description: "Log 5 nights of 7h+ sleep.",
    tier: "silver",
    xpReward: 150,
    predicate: (s) => s.nightsOver7h >= 5,
    progress: (s) => pct(s.nightsOver7h, 5),
  },
  {
    key: "macro_master",
    name: "Macro Master",
    description: "Hit your protein target 7 days running.",
    tier: "gold",
    xpReward: 300,
    predicate: (s) => s.proteinStreakDays >= 7,
    progress: (s) => pct(s.proteinStreakDays, 7),
  },
  {
    key: "level_10",
    name: "Ascendant",
    description: "Reach level 10.",
    tier: "gold",
    xpReward: 500,
    predicate: (s) => s.level >= 10,
    progress: (s) => pct(s.level, 10),
  },
];

/** Returns the keys newly unlocked given the snapshot and prior unlocks. */
export function evaluateAchievements(
  snapshot: AchievementSnapshot,
  alreadyUnlocked: ReadonlySet<string>,
): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.has(a.key) && a.predicate(snapshot),
  );
}
