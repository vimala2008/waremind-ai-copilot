import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, PageHeader, RiskBadge, SectionTitle, StatusPill } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { available, simulateStockChange } from "@/lib/warehouse-logic";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — WareMind" },
      { name: "description", content: "Model stock changes and see projected status, risk, impacted orders and recommended actions." },
      { property: "og:title", content: "What-If Simulator — WareMind" },
      { property: "og:description", content: "Model stock changes and preview the engine's recommended actions." },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const { products, orders, applySimulation } = useWarehouse();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [delta, setDelta] = useState(-5);

  const product = products.find((p) => p.id === productId) ?? products[0];
  const result = product ? simulateStockChange(product, delta, orders) : null;

  return (
    <div>
      <PageHeader
        title="What-If Simulator"
        description="Change stock levels hypothetically and let the deterministic engine project status, risk and the actions it would take."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="p-5">
          <SectionTitle title="Scenario" subtitle="Adjust stock for one SKU" icon={<FlaskConical className="size-5" />} />
          <label className="block text-xs text-muted-foreground">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:glow-ring"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.inStock} in stock)
              </option>
            ))}
          </select>

          <label className="mt-4 block text-xs text-muted-foreground">
            Stock change: <span className="font-medium text-foreground">{delta > 0 ? `+${delta}` : delta}</span> units
          </label>
          <input
            type="range"
            min={-50}
            max={50}
            step={1}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--primary)]"
          />

          <button
            onClick={() => {
              if (!product) return;
              applySimulation(product.id, delta);
              toast.success("Simulation committed", {
                description: `${product.name} adjusted by ${delta > 0 ? "+" : ""}${delta} units.`,
              });
            }}
            className="mt-4 w-full rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Apply to live warehouse
          </button>
        </GlassCard>

        {result ? (
          <>
            <GlassCard className="p-5">
              <SectionTitle title="Projected impact" subtitle={result.productName} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Before</p>
                  <p className="mt-1 font-display text-2xl font-bold">{result.before.stock}</p>
                  <p className="text-xs text-muted-foreground">{result.before.available} available</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusPill status={result.before.status} />
                    <RiskBadge risk={result.before.risk} />
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">After</p>
                  <p className="mt-1 font-display text-2xl font-bold">{result.after.stock}</p>
                  <p className="text-xs text-muted-foreground">{result.after.available} available</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusPill status={result.after.status} />
                    <RiskBadge risk={result.after.risk} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Impacted orders: {result.impactedOrders.length ? result.impactedOrders.join(", ") : "none"}
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <SectionTitle title="Recommended actions" subtitle="Deterministic response plan" />
              <ol className="space-y-2 text-sm">
                {result.actions.map((a, i) => (
                  <li key={a} className="flex gap-2 rounded-xl border border-border/70 bg-secondary/40 p-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
              {product ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Current free stock: {available(product)} · min stock {product.minStock}
                </p>
              ) : null}
            </GlassCard>
          </>
        ) : null}
      </div>
    </div>
  );
}
