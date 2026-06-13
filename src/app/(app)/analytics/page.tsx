import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendChart } from "@/components/modules/TrendChart";
import { demoDays, readinessForecast } from "@/lib/demo-data";
import { forecast } from "@/lib/engines/forecast";

export default function AnalyticsPage() {
  const readiness = demoDays.map((d) => d.readiness ?? 0);
  const strain = demoDays.map((d) => d.strain ?? 0);
  const hrv = demoDays.map((d) => d.hrvMs);
  const hrvForecast = forecast(hrv, 14);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Trends, forecasts and correlations across your performance data"
        accent="var(--color-sleep)"
      />

      <Card>
        <div className="flex items-center justify-between">
          <CardLabel>Readiness + 14-day forecast</CardLabel>
          <Badge tone="ai">
            {readinessForecast.slopePerDay >= 0 ? "+" : ""}
            {readinessForecast.slopePerDay}/day · {(readinessForecast.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
        <div className="mt-3">
          <TrendChart
            data={readiness}
            projection={readinessForecast.projection.map((p) => p.value)}
            color="var(--color-recovery)"
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardLabel>Strain load</CardLabel>
          <div className="mt-3">
            <TrendChart data={strain} color="var(--color-strain)" height={160} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>HRV + forecast</CardLabel>
            <Badge tone="ai">
              {hrvForecast.slopePerDay >= 0 ? "+" : ""}
              {hrvForecast.slopePerDay}/day
            </Badge>
          </div>
          <div className="mt-3">
            <TrendChart
              data={hrv}
              projection={hrvForecast.projection.map((p) => p.value)}
              color="var(--color-ai)"
              height={160}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardLabel>Insight</CardLabel>
        <p className="mt-2 text-sm leading-relaxed text-fg/90">
          Readiness and HRV are both trending upward while strain holds in the optimal band —
          a signal of positive adaptation. The forecast engine projects readiness reaching{" "}
          <span className="font-mono text-recovery">
            {Math.round(readinessForecast.level + readinessForecast.slopePerDay * 14)}
          </span>{" "}
          in 14 days at current load. Maintain this rhythm.
        </p>
      </Card>
    </div>
  );
}
