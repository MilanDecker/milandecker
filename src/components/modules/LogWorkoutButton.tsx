"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, Field, inputClass } from "@/components/ui/Drawer";
import { computeStrain } from "@/lib/engines/strain";
import { logWorkout } from "@/lib/actions/log";
import type { WorkoutType } from "@/lib/types";

const TYPES: WorkoutType[] = ["strength", "cardio", "hiit", "mobility", "sport", "other"];

export function LogWorkoutButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [type, setType] = useState<WorkoutType>("strength");
  const [title, setTitle] = useState("");
  const [durationMin, setDuration] = useState(45);
  const [intensity, setIntensity] = useState(6);

  // Live strain preview from the engine as the user fills the form.
  const previewStrain = computeStrain({ durationMin, intensity });

  function submit() {
    start(async () => {
      const res = await logWorkout({ type, title, durationMin, intensity });
      if (res.ok) {
        setFeedback({ ok: true, text: res.message });
        setTitle("");
        setTimeout(() => setOpen(false), 900);
      } else {
        setFeedback({ ok: false, text: res.error });
      }
    });
  }

  return (
    <>
      <Button onClick={() => { setFeedback(null); setOpen(true); }}>Log Workout</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Log Workout">
        <div className="space-y-4">
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as WorkoutType)}>
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-[var(--color-base)]">{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lower Power" />
          </Field>
          <Field label={`Duration · ${durationMin} min`}>
            <input type="range" min={5} max={180} value={durationMin} onChange={(e) => setDuration(+e.target.value)} className="w-full accent-[var(--color-electric)]" />
          </Field>
          <Field label={`Intensity (RPE) · ${intensity}/10`}>
            <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-[var(--color-strain)]" />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-white/4 px-4 py-3">
            <span className="text-sm text-fg-muted">Projected strain</span>
            <span className="font-mono text-lg font-semibold text-strain">{previewStrain.toFixed(1)}</span>
          </div>

          {feedback && (
            <p className={feedback.ok ? "text-sm text-recovery" : "text-sm text-danger"}>{feedback.text}</p>
          )}

          <Button className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save workout"}
          </Button>
        </div>
      </Drawer>
    </>
  );
}
