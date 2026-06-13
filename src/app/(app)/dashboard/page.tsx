import { IntelligenceTicker } from "@/components/modules/IntelligenceTicker";
import { MetricPoster } from "@/components/modules/MetricPoster";
import { ReadinessRing } from "@/components/modules/ReadinessRing";
import { DailyBriefing } from "@/components/modules/DailyBriefing";
import { Card, CardLabel } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  avgSleepOf,
  getDays,
  getInsights,
  getProfile,
  levelProgress,
  readinessForecastOf,
  weeklyStrainOf,
} from "@/lib/data/queries";
import type { OverseerContext } from "@/lib/ai/overseer";

export default async function DashboardPage() {
  const [{ days }, profile, { insights }] = await Promise.all([
    getDays(30),
    getProfile(),
    getInsights(),
  ]);

  const last7 = days.slice(-7);
  const today = days.at(-1)!;
  const avgSleep = avgSleepOf(days);
  const weeklyStrain = weeklyStrainOf(days);
  const readinessForecast = readinessForecastOf(days);
  const lp = levelProgress(profile.totalXp);

  const ctx: OverseerContext = {
    level: profile.level,
    currentStreak: profile.currentStreak,
    readinessToday: today.readiness ?? 0,
    readinessBand:
      (today.readiness ?? 0) >= 75 ? "primed" : (today.readiness ?? 0) >= 50 ? "moderate" : "low",
    weeklyStrain,
    avgSleepMin: avgSleep,
    forecastSlope: readinessForecast.slopePerDay,
  };

  return (
    <div className="space-y-6">
      <IntelligenceTicker insights={insights} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col justify-center">
          <SectionHeader title="Today's Readiness" caption="Computed live by the readiness engine" />
          <ReadinessRing
            sleepMin={today.sleepMin ?? 0}
            hrvMs={today.hrvMs}
            hrvBaselineMs={72}
            restingHr={today.restingHr}
            restingHrBaseline={51}
            recentStrain={today.strain ?? 0}
          />
        </Card>

        <DailyBriefing ctx={ctx} />
      </div>

      <div>
        <SectionHeader title="Today's Posters" caption="Your core performance signals at a glance" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricPoster
            label="Strain"
            value={(today.strain ?? 0).toFixed(1)}
            delta={12}
            trend={last7.map((d) => d.strain ?? 0)}
            color="var(--color-strain)"
            icon="⚡"
          />
          <MetricPoster
            label="Sleep"
            value={((today.sleepMin ?? 0) / 60).toFixed(1)}
            unit="h"
            delta={-4}
            trend={last7.map((d) => (d.sleepMin ?? 0) / 60)}
            color="var(--color-sleep)"
            icon="☾"
          />
          <MetricPoster
            label="Protein"
            value={String(today.proteinG ?? 0)}
            unit="g"
            delta={8}
            trend={last7.map((d) => d.proteinG ?? 0)}
            color="var(--color-recovery)"
            icon="◍"
          />
          <MetricPoster
            label="HRV"
            value={String(today.hrvMs)}
            unit="ms"
            delta={6}
            trend={last7.map((d) => d.hrvMs)}
            color="var(--color-ai)"
            icon="❤"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex items-center gap-5">
          <Ring value={lp.progress} size={96} thickness={9} color="var(--color-money)">
            <div className="font-display text-xl font-semibold">{lp.level}</div>
          </Ring>
          <div>
            <CardLabel>Level Progress</CardLabel>
            <div className="mt-1 font-display text-lg font-semibold">
              {lp.xpIntoLevel}
              <span className="text-sm font-normal text-fg-muted"> / {lp.xpForNextLevel} XP</span>
            </div>
            <div className="mt-1 text-xs text-fg-muted">
              {profile.currentStreak}-day streak · {profile.totalXp.toLocaleString()} total XP
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-5">
          <Ring value={Math.min(1, weeklyStrain / 80)} size={96} thickness={9} color="var(--color-strain)">
            <div className="font-display text-lg font-semibold">{weeklyStrain.toFixed(0)}</div>
          </Ring>
          <div>
            <CardLabel>Weekly Strain</CardLabel>
            <div className="mt-1 font-display text-lg font-semibold">
              {weeklyStrain.toFixed(0)}<span className="text-sm font-normal text-fg-muted"> / 80 target</span>
            </div>
            <div className="mt-1 text-xs text-fg-muted">Optimal training load band</div>
          </div>
        </Card>

        <Card className="flex items-center gap-5">
          <Ring
            value={Math.min(1, (readinessForecast.level + readinessForecast.slopePerDay * 14) / 100)}
            size={96}
            thickness={9}
            color="var(--color-ai)"
          >
            <div className="font-display text-base font-semibold">
              {Math.round(readinessForecast.level + readinessForecast.slopePerDay * 14)}
            </div>
          </Ring>
          <div>
            <CardLabel>14-Day Forecast</CardLabel>
            <div className="mt-1 font-display text-lg font-semibold">
              {readinessForecast.slopePerDay >= 0 ? "+" : ""}
              {readinessForecast.slopePerDay}/day
            </div>
            <div className="mt-1 text-xs text-fg-muted">
              {(readinessForecast.confidence * 100).toFixed(0)}% confidence · readiness
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
