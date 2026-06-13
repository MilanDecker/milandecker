import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "electric" | "ai" | "recovery" | "strain" | "sleep" | "money" | "neutral" | "danger";

const tones: Record<Tone, string> = {
  electric: "bg-electric/12 text-electric border-electric/25",
  ai: "bg-ai/15 text-ai border-ai/30",
  recovery: "bg-recovery/12 text-recovery border-recovery/25",
  strain: "bg-strain/12 text-strain border-strain/25",
  sleep: "bg-sleep/12 text-sleep border-sleep/25",
  money: "bg-money/12 text-money border-money/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  neutral: "bg-white/5 text-fg-muted border-[var(--color-line)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
