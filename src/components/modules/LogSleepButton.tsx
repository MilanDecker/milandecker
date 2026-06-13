"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, Field, inputClass } from "@/components/ui/Drawer";
import { computeReadiness } from "@/lib/engines/readiness";
import { logSleep } from "@/lib/actions/log";

export function LogSleepButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [nightOf, setNightOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(7.5);
  const [hrvMs, setHrv] = useState(72);
  const [restingHr, setRhr] = useState(51);

  const preview = computeReadiness({
    sleepMin: Math.round(hours * 60),
    hrvMs,
    hrvBaselineMs: 72,
    restingHr,
    restingHrBaseline: 51,
    recentStrain: 0,
  });

  function submit() {
    start(async () => {
      const res = await logSleep({ nightOf, durationMin: Math.round(hours * 60), hrvMs, restingHr });
      if (res.ok) {
        setFeedback({ ok: true, text: res.message });
        setTimeout(() => setOpen(false), 900);
      } else {
        setFeedback({ ok: false, text: res.error });
      }
    });
  }

  return (
    <>
      <Button variant="ghost" onClick={() => { setFeedback(null); setOpen(true); }}>Log Sleep</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Log Sleep">
        <div className="space-y-4">
          <Field label="Night of">
            <input type="date" className={inputClass} value={nightOf} onChange={(e) => setNightOf(e.target.value)} />
          </Field>
          <Field label={`Duration · ${hours.toFixed(1)} h`}>
            <input type="range" min={3} max={11} step={0.25} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full accent-[var(--color-sleep)]" />
          </Field>
          <Field label="HRV (ms)">
            <input type="number" min={0} className={inputClass} value={hrvMs} onChange={(e) => setHrv(+e.target.value)} />
          </Field>
          <Field label="Resting HR (bpm)">
            <input type="number" min={20} className={inputClass} value={restingHr} onChange={(e) => setRhr(+e.target.value)} />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white/4 px-4 py-3">
            <span className="text-sm text-fg-muted">Projected readiness</span>
            <span className="font-mono text-lg font-semibold text-recovery">{preview.score}</span>
          </div>

          {feedback && (
            <p className={feedback.ok ? "text-sm text-recovery" : "text-sm text-danger"}>{feedback.text}</p>
          )}

          <Button className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save sleep"}
          </Button>
        </div>
      </Drawer>
    </>
  );
}
