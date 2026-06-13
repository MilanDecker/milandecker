import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { demoDays } from "@/lib/demo-data";

function colorFor(readiness: number) {
  if (readiness >= 75) return "var(--color-recovery)";
  if (readiness >= 50) return "var(--color-money)";
  return "var(--color-danger)";
}

export default function CalendarPage() {
  const days = demoDays;

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" subtitle="Your performance timeline — readiness, training and logs" />

      <Card>
        <div className="flex items-center justify-between">
          <CardLabel>Last 30 days</CardLabel>
          <div className="flex items-center gap-3 text-[11px] text-fg-muted">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "var(--color-recovery)" }} /> Primed</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "var(--color-money)" }} /> Moderate</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "var(--color-danger)" }} /> Low</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] uppercase tracking-widest text-fg-faint">
              {d}
            </div>
          ))}
          {Array.from({ length: new Date(days[0].day).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const r = d.readiness ?? 0;
            const trained = (d.strain ?? 0) > 0;
            return (
              <div
                key={d.day}
                className="group relative aspect-square rounded-lg border border-[var(--color-line)] p-1.5 transition hover:border-[var(--color-line-strong)]"
                style={{ background: `${colorFor(r)}14` }}
                title={`${d.day} · readiness ${r} · strain ${(d.strain ?? 0).toFixed(1)}`}
              >
                <div className="text-[10px] text-fg-muted">{new Date(d.day).getDate()}</div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorFor(r) }} />
                  {trained && <span className="text-[9px] text-strain">⚡</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
