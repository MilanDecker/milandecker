import { cn } from "@/lib/cn";

interface TrendChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  /** Optional dashed projection appended after the solid history. */
  projection?: number[];
  className?: string;
}

/** Full-width area chart for the analytics module. Pure SVG, no deps. */
export function TrendChart({
  data,
  height = 200,
  color = "var(--color-electric)",
  projection = [],
  className,
}: TrendChartProps) {
  const all = [...data, ...projection];
  if (all.length < 2) return null;

  const width = 800;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const stepX = width / (all.length - 1);
  const pad = 8;

  const toXY = (v: number, i: number) => {
    const x = i * stepX;
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  };

  const histPts = data.map((v, i) => toXY(v, i));
  const projPts = projection.map((v, i) => toXY(v, data.length - 1 + i));

  const path = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const histLine = path(histPts);
  const area = `${histLine} L${histPts.at(-1)![0]},${height} L0,${height} Z`;
  const projLine = projPts.length
    ? `M${histPts.at(-1)![0]},${histPts.at(-1)![1]} ` + path(projPts)
    : "";
  const gid = `trend-${color}-${data.length}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={width} y1={height * g} y2={height * g} stroke="rgba(255,255,255,0.05)" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={histLine} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      {projLine && (
        <path d={projLine} fill="none" stroke={color} strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
      )}
    </svg>
  );
}
