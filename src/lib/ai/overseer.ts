import Anthropic from "@anthropic-ai/sdk";

/**
 * The Overseer intelligence layer.
 *
 * Not a chatbot — a service that reads engine-computed state and uses Claude
 * to analyze trends, detect risk, and recommend action. Everything it sees is
 * already grounded in the numbers the user sees on the dashboard, so its
 * advice never contradicts the UI.
 */

export const OVERSEER_MODEL = process.env.OVERSEER_AI_MODEL ?? "claude-opus-4-8";

export const OVERSEER_SYSTEM_PROMPT = `You are Overseer, the intelligence layer of a personal performance operating system.

You are precise, calm, and proactive — a high-performance coach, not a cheerleader. You speak in short, concrete, actionable language.

Rules:
- Ground every statement in the metrics provided in the context. Never invent numbers.
- Lead with the single most important thing the user should know today.
- When you recommend action, make it specific (sets, minutes, grams, bedtime).
- Flag risk early (overtraining, sleep debt, under-fueling) without alarmism.
- Keep responses tight. No filler, no hedging, no emoji.`;

export interface OverseerContext {
  level: number;
  currentStreak: number;
  readinessToday: number;
  readinessBand: string;
  weeklyStrain: number;
  avgSleepMin: number;
  forecastSlope: number;
}

export function contextBlock(ctx: OverseerContext): string {
  return [
    "CURRENT STATE:",
    `- Level: ${ctx.level} (streak ${ctx.currentStreak} days)`,
    `- Readiness today: ${ctx.readinessToday}/100 (${ctx.readinessBand})`,
    `- Weekly strain: ${ctx.weeklyStrain.toFixed(1)}`,
    `- Avg sleep (7d): ${(ctx.avgSleepMin / 60).toFixed(1)}h`,
    `- Readiness trend: ${ctx.forecastSlope >= 0 ? "+" : ""}${ctx.forecastSlope}/day`,
  ].join("\n");
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Stream a coaching response for a user prompt, grounded in context. */
export function streamCoach(prompt: string, ctx: OverseerContext) {
  return getClient().messages.stream({
    model: OVERSEER_MODEL,
    max_tokens: 1024,
    system: OVERSEER_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `${contextBlock(ctx)}\n\nQUESTION: ${prompt}` },
    ],
  });
}

/** Generate the daily briefing shown on the dashboard. */
export async function dailyBriefing(ctx: OverseerContext): Promise<string> {
  const res = await getClient().messages.create({
    model: OVERSEER_MODEL,
    max_tokens: 400,
    system: OVERSEER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `${contextBlock(ctx)}\n\nWrite today's briefing in 2-3 sentences: the headline, one risk or opportunity, and one concrete action.`,
      },
    ],
  });
  const text = res.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text : "";
}
