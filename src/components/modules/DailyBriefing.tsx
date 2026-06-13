import { Badge } from "@/components/ui/Badge";
import { dailyBriefing, isConfigured, type OverseerContext } from "@/lib/ai/overseer";

/**
 * The daily intelligence briefing. Uses the live Overseer (Claude) layer when
 * configured; otherwise renders a grounded fallback derived from the same
 * engine context so the dashboard is never empty.
 */
export async function DailyBriefing({ ctx }: { ctx: OverseerContext }) {
  let text: string;
  let live = false;

  if (isConfigured()) {
    try {
      text = await dailyBriefing(ctx);
      live = true;
    } catch {
      text = fallbackBriefing(ctx);
    }
  } else {
    text = fallbackBriefing(ctx);
  }

  return (
    <div className="surface surface-strong relative overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--color-ai)" }}
      />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ai/15 text-ai">✦</span>
          <div className="font-display font-semibold">Overseer Briefing</div>
        </div>
        <Badge tone={live ? "ai" : "neutral"}>{live ? "Live" : "Engine"}</Badge>
      </div>
      <p className="text-[15px] leading-relaxed text-fg/90">{text}</p>
    </div>
  );
}

function fallbackBriefing(ctx: OverseerContext): string {
  const trend =
    ctx.forecastSlope > 0.2
      ? "Your readiness trend is climbing"
      : ctx.forecastSlope < -0.2
        ? "Your readiness trend is slipping"
        : "Your readiness is holding steady";
  const action =
    ctx.readinessToday >= 75
      ? "You're primed — schedule your hardest session today and push intensity."
      : ctx.readinessToday >= 50
        ? "Train, but keep volume moderate and prioritize sleep tonight."
        : "Back off today: mobility or a light aerobic flush, then protect tonight's sleep.";
  return `Readiness is ${ctx.readinessToday}/100 (${ctx.readinessBand}) with ${ctx.weeklyStrain.toFixed(0)} strain this week. ${trend} and you're averaging ${(ctx.avgSleepMin / 60).toFixed(1)}h of sleep. ${action}`;
}
