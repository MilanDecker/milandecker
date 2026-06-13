"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric text-deep font-display text-2xl font-bold">
            O
          </span>
          <div>
            <div className="font-display text-xl font-semibold">Overseer OS</div>
            <div className="text-xs text-fg-muted">Your personal performance OS</div>
          </div>
        </div>

        <div className="surface surface-strong p-6">
          {sent ? (
            <div className="text-center">
              <div className="mb-3 text-3xl">✦</div>
              <h1 className="font-display text-lg font-semibold">Check your email</h1>
              <p className="mt-1 text-sm text-fg-muted">
                We sent a magic link to <span className="text-fg">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={signIn} className="space-y-4">
              <div>
                <h1 className="font-display text-lg font-semibold">Sign in</h1>
                <p className="mt-1 text-sm text-fg-muted">
                  Enter your email for a passwordless magic link.
                </p>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-[var(--color-line)] bg-white/4 px-4 text-sm outline-none focus:border-electric/40"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-fg-faint">
          Protected by Supabase Auth · data isolated per user via RLS
        </p>
      </div>
    </div>
  );
}
