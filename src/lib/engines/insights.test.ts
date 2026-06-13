import { describe, it, expect } from "vitest";
import { detectInsights, type InsightDay } from "./insights";

function makeDays(map: (i: number) => Partial<InsightDay>, n = 14): InsightDay[] {
  return Array.from({ length: n }, (_, i) => ({
    readiness: 70,
    strain: 8,
    sleepMin: 450,
    hrvMs: 72,
    ...map(i),
  }));
}

describe("Insight engine", () => {
  it("returns nothing without enough history", () => {
    expect(detectInsights(makeDays(() => ({}), 2), { level: 1, totalXp: 0 })).toHaveLength(0);
  });

  it("flags a rising readiness trend", () => {
    const days = makeDays((i) => ({ readiness: 50 + i * 2 }));
    const insights = detectInsights(days, { level: 5, totalXp: 1000 });
    expect(insights.some((i) => i.metric === "readiness" && i.kind === "trend")).toBe(true);
  });

  it("flags sleep debt when recent nights are short", () => {
    const days = makeDays((i) => ({ sleepMin: i >= 9 ? 320 : 450 }));
    const insights = detectInsights(days, { level: 5, totalXp: 1000 });
    expect(insights.some((i) => i.metric === "sleep" && i.kind === "risk")).toBe(true);
  });

  it("surfaces an opportunity when primed and lightly loaded", () => {
    const days = makeDays((i) => ({ readiness: i === 13 ? 82 : 78, strain: 2 }));
    const insights = detectInsights(days, { level: 5, totalXp: 1000 });
    expect(insights.some((i) => i.kind === "opportunity")).toBe(true);
  });
});
