import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface RingProps {
  /** 0..1 fill. */
  value: number;
  size?: number;
  thickness?: number;
  /** CSS color or token var, e.g. "var(--color-electric)". */
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * The Overseer progress ring — the core data-viz primitive. A clean SVG arc
 * with a soft glow, used for readiness, recovery, strain targets, and XP.
 */
export function Ring({
  value,
  size = 160,
  thickness = 12,
  color = "var(--color-electric)",
  trackColor = "rgba(255,255,255,0.07)",
  children,
  className,
}: RingProps) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * v;
  const gid = `ring-${Math.round(value * 1000)}-${size}`;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 0.9s var(--ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
