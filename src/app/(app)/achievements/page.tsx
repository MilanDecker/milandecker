import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Ring } from "@/components/ui/Ring";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ACHIEVEMENTS, type AchievementSnapshot } from "@/lib/engines/achievements";
import { getDays, getProfile, levelProgress } from "@/lib/data/queries";

const TIER_TONE = { bronze: "money", silver: "neutral", gold: "money" } as const;

export default async function AchievementsPage() {
  const [{ days }, demoProfile] = await Promise.all([getDays(30), getProfile()]);
  const lp = levelProgress(demoProfile.totalXp);
  const snapshot: AchievementSnapshot = {
    totalWorkouts: days.filter((d) => (d.strain ?? 0) > 0).length,
    totalStrain: days.reduce((s, d) => s + (d.strain ?? 0), 0),
    currentStreak: demoProfile.currentStreak,
    level: demoProfile.level,
    nightsOver7h: days.filter((d) => (d.sleepMin ?? 0) >= 420).length,
    proteinStreakDays: 4,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        subtitle="XP, levels and unlocks from the gamification engine"
        accent="var(--color-money)"
      />

      <Card className="flex flex-wrap items-center gap-6">
        <Ring value={lp.progress} size={120} thickness={11} color="var(--color-money)">
          <div className="text-center">
            <div className="font-display text-3xl font-semibold text-money">{lp.level}</div>
            <div className="text-[10px] uppercase tracking-widest text-fg-muted">Level</div>
          </div>
        </Ring>
        <div className="flex-1">
          <div className="font-display text-xl font-semibold">{demoProfile.totalXp.toLocaleString()} XP</div>
          <div className="mt-1 text-sm text-fg-muted">
            {lp.xpForNextLevel - lp.xpIntoLevel} XP to level {lp.level + 1} ·{" "}
            {demoProfile.currentStreak}-day streak · best {demoProfile.longestStreak}
          </div>
          <div className="mt-3 max-w-md">
            <ProgressBar value={lp.progress} color="var(--color-money)" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const progress = a.progress(snapshot);
          const unlocked = a.predicate(snapshot);
          return (
            <Card key={a.key} className={unlocked ? "" : "opacity-75"}>
              <div className="flex items-start justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl text-xl"
                  style={{
                    background: unlocked ? "var(--color-money)1f" : "rgba(255,255,255,0.05)",
                    color: unlocked ? "var(--color-money)" : "var(--color-fg-faint)",
                  }}
                >
                  {unlocked ? "★" : "☆"}
                </span>
                <Badge tone={TIER_TONE[a.tier]}>{a.tier}</Badge>
              </div>
              <div className="mt-3 font-display font-semibold">{a.name}</div>
              <div className="mt-0.5 text-xs text-fg-muted">{a.description}</div>
              <div className="mt-3">
                <ProgressBar value={progress} color="var(--color-money)" />
                <div className="mt-1.5 flex justify-between text-[11px] text-fg-muted">
                  <span>{unlocked ? "Unlocked" : `${Math.round(progress * 100)}%`}</span>
                  <span className="font-mono">+{a.xpReward} XP</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
