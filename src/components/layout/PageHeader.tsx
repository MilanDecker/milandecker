import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  accent = "var(--color-electric)",
  action,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full" style={{ background: accent }} />
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 pl-3.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
