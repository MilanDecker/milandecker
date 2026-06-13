import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  color = "var(--color-electric)",
  className,
}: {
  value: number; // 0..1
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/6", className)}>
      <span
        className="block h-full rounded-full transition-[width] duration-1000"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}
