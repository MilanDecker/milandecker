import { describe, it, expect } from "vitest";
import { applyXp, deriveWorkout, deriveSleep, deriveNutrition } from "./pipeline";
import { xpForLevel } from "./xp";

describe("applyXp", () => {
  it("adds XP and keeps the level when below the threshold", () => {
    const t = applyXp(0, { source: "habit", amount: 10, reason: "x" });
    expect(t.totalXp).toBe(10);
    expect(t.level).toBe(1);
    expect(t.leveledUp).toBe(false);
  });

  it("detects a level-up across a boundary", () => {
    const justBelow = xpForLevel(2) - 5;
    const t = applyXp(justBelow, { source: "workout", amount: 60, reason: "x" });
    expect(t.level).toBe(2);
    expect(t.leveledUp).toBe(true);
  });
});

describe("deriveWorkout", () => {
  it("produces strain and a proportional XP award", () => {
    const easy = deriveWorkout({ durationMin: 30, intensity: 3 });
    const hard = deriveWorkout({ durationMin: 60, intensity: 9 });
    expect(hard.strain).toBeGreaterThan(easy.strain);
    expect(hard.xp.amount).toBeGreaterThan(easy.xp.amount);
  });
});

describe("deriveSleep", () => {
  it("turns a good night into high readiness + XP", () => {
    const d = deriveSleep({
      sleepMin: 480,
      hrvMs: 90,
      hrvBaselineMs: 75,
      restingHr: 48,
      restingHrBaseline: 52,
      recentStrain: 3,
    });
    expect(d.readiness).toBeGreaterThanOrEqual(75);
    expect(d.band).toBe("primed");
    expect(d.xp.amount).toBeGreaterThan(0);
  });
});

describe("deriveNutrition", () => {
  it("scores fuel against targets", () => {
    const onTarget = deriveNutrition(
      { calories: 2600, proteinG: 180 },
      { calories: 2600, proteinG: 180 },
    );
    const under = deriveNutrition(
      { calories: 1200, proteinG: 60 },
      { calories: 2600, proteinG: 180 },
    );
    expect(onTarget.fuel).toBeGreaterThan(under.fuel);
    expect(onTarget.fuel).toBeCloseTo(1, 1);
  });
});
