import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardLabel } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import { TrendChart } from "@/components/modules/TrendChart";
import { LogMealButton } from "@/components/modules/LogMealButton";
import { getDays } from "@/lib/data/queries";

const TARGETS = { calories: 2600, protein: 180, carbs: 280, fat: 80 };

export default async function NutritionPage() {
  const { days } = await getDays(30);
  const today = days.at(-1)!;
  const carbs = 240;
  const fat = 70;

  const macros = [
    { label: "Calories", value: today.calories ?? 0, target: TARGETS.calories, color: "var(--color-money)", unit: "kcal" },
    { label: "Protein", value: today.proteinG ?? 0, target: TARGETS.protein, color: "var(--color-recovery)", unit: "g" },
    { label: "Carbs", value: carbs, target: TARGETS.carbs, color: "var(--color-electric)", unit: "g" },
    { label: "Fat", value: fat, target: TARGETS.fat, color: "var(--color-strain)", unit: "g" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        subtitle="Fuel adequacy feeds directly into your readiness score"
        accent="var(--color-recovery)"
        action={<LogMealButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {macros.map((m) => (
          <Card key={m.label} className="flex items-center gap-4">
            <Ring value={m.value / m.target} size={84} thickness={8} color={m.color}>
              <div className="font-mono text-xs">{Math.round((m.value / m.target) * 100)}%</div>
            </Ring>
            <div>
              <CardLabel>{m.label}</CardLabel>
              <div className="mt-1 font-display text-xl font-semibold tabular">
                {m.value}
                <span className="text-xs font-normal text-fg-muted"> / {m.target} {m.unit}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardLabel>Calories — last 30 days</CardLabel>
        <div className="mt-3">
          <TrendChart data={days.map((d) => d.calories ?? 0)} color="var(--color-money)" />
        </div>
      </Card>

      <Card>
        <CardLabel>Protein — last 30 days</CardLabel>
        <div className="mt-3">
          <TrendChart data={days.map((d) => d.proteinG ?? 0)} color="var(--color-recovery)" />
        </div>
      </Card>
    </div>
  );
}
