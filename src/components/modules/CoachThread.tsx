"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { OverseerContext } from "@/lib/ai/overseer";

interface Message {
  role: "user" | "overseer";
  text: string;
}

const SUGGESTIONS = [
  "Should I train hard today?",
  "How is my recovery trending?",
  "Plan my week around my readiness.",
  "Am I at risk of overtraining?",
];

/**
 * The Overseer coach thread. Streams tokens from /api/coach, grounded in the
 * same engine context the dashboard shows.
 */
export function CoachThread({ ctx }: { ctx: OverseerContext }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(prompt: string) {
    if (!prompt.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text: prompt }, { role: "overseer", text: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, context: ctx }),
      });

      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: "Overseer is unavailable." }));
        appendToLast(error ?? "Overseer is unavailable.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      appendToLast("Overseer could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  function appendToLast(chunk: string) {
    setMessages((m) => {
      const next = [...m];
      next[next.length - 1] = { role: "overseer", text: next[next.length - 1].text + chunk };
      return next;
    });
  }

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ai/15 text-2xl text-ai">
                ✦
              </div>
              <h3 className="font-display text-lg font-semibold">Ask Overseer</h3>
              <p className="mt-1 text-sm text-fg-muted">
                Grounded in your live readiness, strain, sleep and trend data.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-fg-muted transition hover:border-ai/40 hover:text-fg"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[78%] rounded-2xl rounded-br-sm bg-white/8 px-4 py-2.5 text-sm"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-ai/20 bg-ai/8 px-4 py-2.5 text-sm leading-relaxed"
              }
            >
              {m.text || <span className="text-fg-faint">…</span>}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Overseer about your performance…"
          className="h-11 flex-1 rounded-full border border-[var(--color-line)] bg-white/4 px-4 text-sm outline-none focus:border-ai/40"
        />
        <Button type="submit" variant="ai" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
