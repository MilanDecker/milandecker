import { demoProfile } from "@/lib/demo-data";
import { levelProgress } from "@/lib/engines/xp";

export function TopBar() {
  const lp = levelProgress(demoProfile.totalXp);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-deep)]/80 px-5 py-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="live-dot h-2 w-2 rounded-full bg-electric shadow-[0_0_8px_var(--glow-electric)]" />
        <div>
          <div className="text-sm font-medium">
            {greeting}, {demoProfile.displayName}
          </div>
          <div className="text-xs text-fg-muted">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs text-fg-muted">Level</span>
          <span className="font-display text-sm font-semibold">{lp.level}</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/8">
            <span
              className="block h-full rounded-full bg-electric"
              style={{ width: `${lp.progress * 100}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-fg-muted">
            {lp.xpIntoLevel}/{lp.xpForNextLevel}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-strain/12 px-2.5 py-1 text-strain">
          <span>🔥</span>
          <span className="font-mono text-xs font-semibold">{demoProfile.currentStreak}</span>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-elevated font-display text-sm font-semibold">
          {demoProfile.displayName?.[0] ?? "O"}
        </div>
      </div>
    </header>
  );
}
