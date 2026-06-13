"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer, Field, inputClass } from "@/components/ui/Drawer";
import { logNutrition } from "@/lib/actions/log";

type Slot = "breakfast" | "lunch" | "dinner" | "snack";
const SLOTS: Slot[] = ["breakfast", "lunch", "dinner", "snack"];

export function LogMealButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [slot, setSlot] = useState<Slot>("lunch");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(600);
  const [proteinG, setProtein] = useState(40);

  function submit() {
    start(async () => {
      const res = await logNutrition({ slot, name, calories, proteinG });
      if (res.ok) {
        setFeedback({ ok: true, text: res.message });
        setName("");
        setTimeout(() => setOpen(false), 900);
      } else {
        setFeedback({ ok: false, text: res.error });
      }
    });
  }

  return (
    <>
      <Button variant="ghost" onClick={() => { setFeedback(null); setOpen(true); }}>Log Meal</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Log Meal">
        <div className="space-y-4">
          <Field label="Meal">
            <select className={inputClass} value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>
              {SLOTS.map((s) => (
                <option key={s} value={s} className="bg-[var(--color-base)]">{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken & rice" />
          </Field>
          <Field label="Calories">
            <input type="number" min={0} className={inputClass} value={calories} onChange={(e) => setCalories(+e.target.value)} />
          </Field>
          <Field label="Protein (g)">
            <input type="number" min={0} className={inputClass} value={proteinG} onChange={(e) => setProtein(+e.target.value)} />
          </Field>

          {feedback && (
            <p className={feedback.ok ? "text-sm text-recovery" : "text-sm text-danger"}>{feedback.text}</p>
          )}

          <Button className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save meal"}
          </Button>
        </div>
      </Drawer>
    </>
  );
}
