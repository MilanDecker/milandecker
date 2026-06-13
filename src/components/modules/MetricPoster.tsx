import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatDelta } from "@/components/ui/StatDelta";
import { cn } from "@/lib/cn";

interface MetricPosterProps {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  trend?: number[];
  color?: string;
  icon?: string;
  className?: string;
}

/**
 * A "poster" — the large, scannable metric tile that fills the dashboard
 * grid. Icon, value, delta, and an inline trend, all on-system.
 */
export function MetricPoster({
  label,
  value,
  unit,
  delta,
  trend,
  color = "var(--color-electric)",
  icon,
  className,
}: MetricPosterProps) {
  return (
    <Card interactive className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-base"
          style={{ background: `${color}1f`, color }}
        >
          {icon}
        </span>
        {delta !== undefined && <StatDelta value={delta} />}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl font-semibold tabular">{value}</span>
          {unit && <span className="text-sm text-fg-muted">{unit}</span>}
        </div>
        <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-fg-muted">
          {label}
        </div>
      </div>
      {trend && trend.length > 1 && (
        <Sparkline data={trend} color={color} width={220} height={34} className="w-full" />
      )}
    </Card>
  );
}
