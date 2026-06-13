import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/modules/TrendChart";
import { LogWorkoutButton } from "@/components/modules/LogWorkoutButton";
import { demoDays, weeklyStrain } from "@/lib/demo-data";

const RECENT = [
  { title: "Lower Power", type: "strength", min: 62, strain: 14.2, vol: "8,420 kg" },
  { title: "Zone 2 Run", type: "cardio", min: 48, strain: 9.1, vol: "8.1 km" },
  { title: "Upper Hypertrophy", type: "strength", min: 55, strain: 12.6, vol: "6,980 kg" },
  { title: "Mobility Flow", type: "mobility", min: 25, strain: 3.4, vol: "—" },
];

export default function TrainingPage() {
  const strainSeries = demoDays.map((d) => d.strain ?? 0);
  const sessions = demoDays.filter((d) => (d.strain ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training"
        subtitle="Sessions, load, and strain — computed by the strain engine"
        action={<LogWorkoutButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardLabel>Weekly Strain</CardLabel>
          <div className="mt-1 font-display text-3xl font-semibold tabular text-strain">
            {weeklyStrain.toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-fg-muted">Optimal load band</div>
        </Card>
        <Card>
          <CardLabel>Sessions (30d)</CardLabel>
          <div className="mt-1 font-display text-3xl font-semibold tabular">{sessions}</div>
          <div className="mt-1 text-xs text-fg-muted">{(sessions / 4.3).toFixed(1)} / week</div>
        </Card>
        <Card>
          <CardLabel>Avg Session Strain</CardLabel>
          <div className="mt-1 font-display text-3xl font-semibold tabular">
            {(strainSeries.filter((s) => s > 0).reduce((a, b) => a + b, 0) / sessions).toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-fg-muted">Per training day</div>
        </Card>
      </div>

      <Card>
        <CardLabel>Strain — last 30 days</CardLabel>
        <div className="mt-3">
          <TrendChart data={strainSeries} color="var(--color-strain)" />
        </div>
      </Card>

      <Card>
        <CardLabel>Recent Sessions</CardLabel>
        <div className="mt-3 divide-y divide-[var(--color-line)]">
          {RECENT.map((w) => (
            <div key={w.title} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{w.title}</div>
                <div className="text-xs text-fg-muted">
                  {w.min} min · {w.vol}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="neutral">{w.type}</Badge>
                <span className="font-mono text-sm text-strain">{w.strain.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
