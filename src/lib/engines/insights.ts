/**
 * Insight Engine — proactive intelligence. Scans the user's recent history and
 * surfaces trends, risks, opportunities and milestones. Deterministic and
 * rule-based so the ticker is always populated; the AI layer (overseer.ts)
 * builds richer narratives on top of these same signals.
 */
import { forecast } from "./forecast";
import { levelProgress } from "./xp";
import type { InsightKind } from "@/lib/types";

export interface DetectedInsight {
  kind: InsightKind;
  title: string;
  body: string;
  metric: string;
}

export interface InsightDay {
  readiness: number | null;
  strain: number | null;
  sleepMin: number | null;
  hrvMs: number;
}

export function detectInsights(
  days: InsightDay[],
  profile: { level: number; totalXp: number },
): DetectedInsight[] {
  const out: DetectedInsight[] = [];
  if (days.length < 3) return out;

  const last7 = days.slice(-7);
  const today = days.at(-1)!;

  // Readiness trajectory
  const rf = forecast(days.map((d) => d.readiness ?? 0), 14);
  if (rf.slopePerDay > 0.3) {
    out.push({
      kind: "trend",
      title: `Readiness trending up ${rf.slopePerDay.toFixed(1)}/day`,
      body: "Your recovery trajectory is improving — capacity for higher load.",
      metric: "readiness",
    });
  } else if (rf.slopePerDay < -0.3) {
    out.push({
      kind: "risk",
      title: "Readiness is slipping",
      body: "Your recovery trend has turned negative. Protect sleep and ease volume.",
      metric: "readiness",
    });
  }

  // HRV trend
  const hf = forecast(days.map((d) => d.hrvMs), 14);
  if (hf.slopePerDay > 0.4) {
    out.push({
      kind: "trend",
      title: `HRV climbing ${hf.slopePerDay.toFixed(1)} ms/day`,
      body: "Autonomic recovery is strengthening — a sign of positive adaptation.",
      metric: "hrv",
    });
  }

  // Sleep debt
  const avgSleep5 = last7.slice(-5).reduce((s, d) => s + (d.sleepMin ?? 0), 0) / Math.min(5, last7.length);
  if (avgSleep5 < 390) {
    out.push({
      kind: "risk",
      title: "Sleep debt building",
      body: `You're averaging ${(avgSleep5 / 60).toFixed(1)}h recently. Readiness will follow it down.`,
      metric: "sleep",
    });
  }

  // Weekly load
  const weeklyStrain = last7.reduce((s, d) => s + (d.strain ?? 0), 0);
  if (weeklyStrain > 90) {
    out.push({
      kind: "risk",
      title: "Training load is high",
      body: `${weeklyStrain.toFixed(0)} strain this week. Schedule a deload to avoid overreaching.`,
      metric: "strain",
    });
  } else if ((today.readiness ?? 0) >= 75 && weeklyStrain < 60) {
    out.push({
      kind: "opportunity",
      title: "Primed for a hard session",
      body: "High readiness with room in your weekly load. Push intensity today.",
      metric: "readiness",
    });
  }

  // Level milestone
  const lp = levelProgress(profile.totalXp);
  if (lp.progress >= 0.8) {
    out.push({
      kind: "milestone",
      title: `Close to Level ${lp.level + 1}`,
      body: `Just ${lp.xpForNextLevel - lp.xpIntoLevel} XP to go — keep your streak alive.`,
      metric: "xp",
    });
  }

  return out;
}
