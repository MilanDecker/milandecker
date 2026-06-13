import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { demoProfile } from "@/lib/demo-data";

const INTEGRATIONS = [
  { name: "WHOOP", desc: "Strain, recovery, HRV", status: "Connect" },
  { name: "Oura Ring", desc: "Sleep stages, readiness", status: "Connect" },
  { name: "Apple Health", desc: "Workouts, heart rate", status: "Connect" },
  { name: "Google Calendar", desc: "Plan sessions, sync events", status: "Connect" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Profile, goals, integrations and account" />

      <Card>
        <CardLabel>Profile</CardLabel>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-elevated font-display text-xl font-semibold">
            {demoProfile.displayName?.[0]}
          </div>
          <div>
            <div className="font-display text-lg font-semibold">{demoProfile.displayName}</div>
            <div className="text-sm text-fg-muted">@{demoProfile.handle} · Level {demoProfile.level}</div>
          </div>
          <Button variant="outline" className="ml-auto">Edit</Button>
        </div>
      </Card>

      <Card>
        <CardLabel>Integrations</CardLabel>
        <div className="mt-3 divide-y divide-[var(--color-line)]">
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-fg-muted">{i.desc}</div>
              </div>
              <Button variant="ghost" size="sm">{i.status}</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel>Overseer Intelligence</CardLabel>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-fg-muted">
            Model powering proactive coaching and briefings.
          </div>
          <Badge tone="ai">{process.env.OVERSEER_AI_MODEL ?? "claude-opus-4-8"}</Badge>
        </div>
      </Card>
    </div>
  );
}
