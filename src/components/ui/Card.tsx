import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "surface p-5",
        interactive && "interactive cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.14em] text-fg-muted">
      {children}
    </div>
  );
}
