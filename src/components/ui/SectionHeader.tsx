import type { ReactNode } from "react";

export function SectionHeader({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {caption && <p className="mt-0.5 text-sm text-fg-muted">{caption}</p>}
      </div>
      {action}
    </div>
  );
}
