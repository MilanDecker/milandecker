import { NextRequest } from "next/server";
import { isConfigured, streamCoach, type OverseerContext } from "@/lib/ai/overseer";

export const runtime = "nodejs";

interface CoachBody {
  prompt: string;
  context: OverseerContext;
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Overseer AI is not configured. Set ANTHROPIC_API_KEY.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  let body: CoachBody;
  try {
    body = (await req.json()) as CoachBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!body.prompt?.trim()) {
    return new Response(JSON.stringify({ error: "Prompt is required." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const ai = streamCoach(body.prompt, body.context);
        ai.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        await ai.finalMessage();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            "\n\n[Overseer encountered an error reaching the model.]",
          ),
        );
        console.error("coach stream error", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
