import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import { TrendChart } from "@/components/modules/TrendChart";
import { LogSleepButton } from "@/components/modules/LogSleepButton";
import { getDays } from "@/lib/data/queries";

export default async function RecoveryPage() {
  const { days } = await getDays(30);
  const today = days.at(-1)!;
  const last7 = days.slice(-7);
  const avgSleep = last7.reduce((s, d) => s + (d.sleepMin ?? 0), 0) / last7.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery"
        subtitle="Sleep, HRV and resting heart rate — the inputs to readiness"
        accent="var(--color-recovery)"
        action={<LogSleepButton />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="flex flex-col items-center justify-center gap-4 text-center">
          <Ring value={(today.readiness ?? 0) / 100} size={160} thickness={13} color="var(--color-recovery)">
            <div>
              <div className="font-display text-4xl font-semibold text-recovery">
                {today.readiness}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-fg-muted">Readiness</div>
            </div>
          </Ring>
          <p className="text-sm text-fg-muted">Last night set today's recovery ceiling.</p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Sleep", value: ((today.sleepMin ?? 0) / 60).toFixed(1), unit: "h", color: "var(--color-sleep)" },
            { label: "HRV", value: String(today.hrvMs), unit: "ms", color: "var(--color-ai)" },
            { label: "Resting HR", value: String(today.restingHr), unit: "bpm", color: "var(--color-recovery)" },
            { label: "7d Avg Sleep", value: (avgSleep / 60).toFixed(1), unit: "h", color: "var(--color-sleep)" },
          ].map((m) => (
            <Card key={m.label}>
              <CardLabel>{m.label}</CardLabel>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold tabular" style={{ color: m.color }}>
                  {m.value}
                </span>
                <span className="text-sm text-fg-muted">{m.unit}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardLabel>Readiness — last 30 days</CardLabel>
        <div className="mt-3">
          <TrendChart data={days.map((d) => d.readiness ?? 0)} color="var(--color-recovery)" />
        </div>
      </Card>

      <Card>
        <CardLabel>Sleep duration — last 30 days</CardLabel>
        <div className="mt-3">
          <TrendChart data={days.map((d) => (d.sleepMin ?? 0) / 60)} color="var(--color-sleep)" />
        </div>
      </Card>
    </div>
  );
}
