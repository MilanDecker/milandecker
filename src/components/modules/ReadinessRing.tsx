import { Ring } from "@/components/ui/Ring";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeReadiness } from "@/lib/engines/readiness";

const BAND_COLOR = {
  primed: "var(--color-recovery)",
  moderate: "var(--color-money)",
  low: "var(--color-danger)",
} as const;

/**
 * The hero readiness ring. Recomputes from the engine so the breakdown shown
 * is exactly what drives the score.
 */
export function ReadinessRing({
  sleepMin,
  hrvMs,
  hrvBaselineMs,
  restingHr,
  restingHrBaseline,
  recentStrain,
}: {
  sleepMin: number;
  hrvMs: number;
  hrvBaselineMs: number;
  restingHr: number;
  restingHrBaseline: number;
  recentStrain: number;
}) {
  const r = computeReadiness({
    sleepMin,
    hrvMs,
    hrvBaselineMs,
    restingHr,
    restingHrBaseline,
    recentStrain,
    fuel: 0.85,
  });
  const color = BAND_COLOR[r.band];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <Ring value={r.score / 100} size={184} thickness={14} color={color}>
        <div>
          <div className="font-display text-5xl font-semibold tabular" style={{ color }}>
            {r.score}
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-fg-muted">
            Readiness
          </div>
        </div>
      </Ring>

      <div className="w-full flex-1 space-y-3">
        <div className="text-sm text-fg-muted">
          You are{" "}
          <span className="font-semibold capitalize" style={{ color }}>
            {r.band}
          </span>{" "}
          today. Drivers below show what moved the score.
        </div>
        {r.drivers.map((d) => (
          <div key={d.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-fg-muted">{d.label}</span>
              <span className="font-mono text-fg">+{d.contribution}</span>
            </div>
            <ProgressBar value={d.contribution / 35} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}
