import { cn } from "@/lib/cn";

/** A small up/down delta pill used on metric posters. */
export function StatDelta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular",
        up ? "bg-recovery/12 text-recovery" : "bg-danger/12 text-danger",
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value)}
      {suffix}
    </span>
  );
}
