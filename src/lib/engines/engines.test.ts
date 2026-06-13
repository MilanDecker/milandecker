import { describe, it, expect } from "vitest";
import { xpForLevel, levelForXp, levelProgress, awardXp } from "./xp";
import { computeStrain, strainQuality } from "./strain";
import { computeReadiness } from "./readiness";
import { forecast, etaToTarget } from "./forecast";
import { evaluateAchievements, type AchievementSnapshot } from "./achievements";

describe("XP engine", () => {
  it("is monotonic and starts at 0", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(9));
  });

  it("inverts the level curve", () => {
    for (const lvl of [1, 2, 5, 10, 25]) {
      expect(levelForXp(xpForLevel(lvl))).toBe(lvl);
      expect(levelForXp(xpForLevel(lvl + 1) - 1)).toBe(lvl);
    }
  });

  it("reports progress within a level", () => {
    const p = levelProgress(xpForLevel(3));
    expect(p.level).toBe(3);
    expect(p.progress).toBe(0);
    expect(p.xpForNextLevel).toBeGreaterThan(0);
  });

  it("scales awards by quality and streak", () => {
    const low = awardXp("workout", { quality: 0 });
    const high = awardXp("workout", { quality: 1 });
    const streaked = awardXp("workout", { quality: 1, streakDays: 20 });
    expect(high.amount).toBeGreaterThan(low.amount);
    expect(streaked.amount).toBeGreaterThan(high.amount);
  });
});

describe("Strain engine", () => {
  it("returns 0 for a zero-duration session", () => {
    expect(computeStrain({ durationMin: 0 })).toBe(0);
  });

  it("rises with intensity and stays within scale", () => {
    const easy = computeStrain({ durationMin: 45, intensity: 3 });
    const hard = computeStrain({ durationMin: 45, intensity: 9 });
    expect(hard).toBeGreaterThan(easy);
    expect(hard).toBeLessThanOrEqual(21);
  });

  it("derives a bounded quality signal", () => {
    expect(strainQuality(0)).toBe(0);
    expect(strainQuality(50)).toBe(1);
  });
});

describe("Readiness engine", () => {
  it("scores a well-rested athlete as primed", () => {
    const r = computeReadiness({
      sleepMin: 480,
      hrvMs: 90,
      hrvBaselineMs: 75,
      restingHr: 48,
      restingHrBaseline: 52,
      recentStrain: 4,
      fuel: 0.9,
    });
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.band).toBe("primed");
  });

  it("penalizes poor sleep and high strain debt", () => {
    const poor = computeReadiness({ sleepMin: 240, recentStrain: 18 });
    const rested = computeReadiness({ sleepMin: 480, recentStrain: 2 });
    expect(poor.score).toBeLessThan(rested.score);
    expect(poor.band).not.toBe("primed");
  });
});

describe("Forecast engine", () => {
  it("projects an upward trend forward", () => {
    const f = forecast([1, 2, 3, 4, 5], 5);
    expect(f.slopePerDay).toBeGreaterThan(0);
    expect(f.projection.at(-1)!.value).toBeGreaterThan(5);
  });

  it("estimates ETA to a target", () => {
    const eta = etaToTarget([70, 72, 74, 76], 84);
    expect(eta).toBeGreaterThan(0);
  });

  it("returns null ETA when flat", () => {
    expect(etaToTarget([50, 50, 50], 60)).toBeNull();
  });
});

describe("Achievement engine", () => {
  const base: AchievementSnapshot = {
    totalWorkouts: 0,
    totalStrain: 0,
    currentStreak: 0,
    level: 1,
    nightsOver7h: 0,
    proteinStreakDays: 0,
  };

  it("unlocks first workout once logged", () => {
    const unlocked = evaluateAchievements({ ...base, totalWorkouts: 1 }, new Set());
    expect(unlocked.map((a) => a.key)).toContain("first_workout");
  });

  it("does not re-unlock already-earned achievements", () => {
    const unlocked = evaluateAchievements(
      { ...base, totalWorkouts: 1 },
      new Set(["first_workout"]),
    );
    expect(unlocked).toHaveLength(0);
  });
});
