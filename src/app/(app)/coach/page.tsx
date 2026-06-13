import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CoachThread } from "@/components/modules/CoachThread";
import { isConfigured, type OverseerContext } from "@/lib/ai/overseer";
import { demoDays, demoProfile, readinessForecast, today, weeklyStrain } from "@/lib/demo-data";

export default function CoachPage() {
  const last7 = demoDays.slice(-7);
  const avgSleep = Math.round(last7.reduce((s, d) => s + (d.sleepMin ?? 0), 0) / last7.length);
  const readiness = today.readiness ?? 0;

  const ctx: OverseerContext = {
    level: demoProfile.level,
    currentStreak: demoProfile.currentStreak,
    readinessToday: readiness,
    readinessBand: readiness >= 75 ? "primed" : readiness >= 50 ? "moderate" : "low",
    weeklyStrain,
    avgSleepMin: avgSleep,
    forecastSlope: readinessForecast.slopePerDay,
  };

  return (
    <div>
      <PageHeader
        title="Overseer Coach"
        subtitle="The intelligence layer — grounded in your live metrics"
        accent="var(--color-ai)"
        action={
          <Badge tone={isConfigured() ? "ai" : "neutral"}>
            {isConfigured() ? "Claude · live" : "Set ANTHROPIC_API_KEY"}
          </Badge>
        }
      />
      <CoachThread ctx={ctx} />
    </div>
  );
}
