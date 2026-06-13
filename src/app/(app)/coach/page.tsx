import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CoachThread } from "@/components/modules/CoachThread";
import { isConfigured, type OverseerContext } from "@/lib/ai/overseer";
import { avgSleepOf, getDays, getProfile, readinessForecastOf, weeklyStrainOf } from "@/lib/data/queries";

export default async function CoachPage() {
  const [{ days }, profile] = await Promise.all([getDays(30), getProfile()]);
  const today = days.at(-1)!;
  const readiness = today.readiness ?? 0;

  const ctx: OverseerContext = {
    level: profile.level,
    currentStreak: profile.currentStreak,
    readinessToday: readiness,
    readinessBand: readiness >= 75 ? "primed" : readiness >= 50 ? "moderate" : "low",
    weeklyStrain: weeklyStrainOf(days),
    avgSleepMin: avgSleepOf(days),
    forecastSlope: readinessForecastOf(days).slopePerDay,
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
