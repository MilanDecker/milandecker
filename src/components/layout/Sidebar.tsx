"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[230px] shrink-0 flex-col border-r border-[var(--color-line)] px-4 py-6 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-electric text-deep font-display text-lg font-bold">
          O
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          Overseer<span className="text-fg-faint">OS</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-white/8 text-fg" : "text-fg-muted hover:bg-white/4 hover:text-fg",
              )}
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-[15px] transition"
                style={active ? { color: item.accent, background: "rgba(255,255,255,0.06)" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {active && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--color-line)] p-3 text-xs text-fg-muted">
        <div className="mb-1 font-medium text-fg">Overseer Intelligence</div>
        Proactively monitoring your performance signals.
      </div>
    </aside>
  );
}
