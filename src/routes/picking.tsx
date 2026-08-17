import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GlassCard, PageHeader, PriorityBadge, SectionTitle } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { detectBottleneck } from "@/lib/warehouse-logic";

export const Route = createFileRoute("/picking")({
  head: () => ({
    meta: [
      { title: "Picking & Packing — WareMind" },
      { name: "description", content: "Optimised pick routes by zone and bin, packing queue and throughput bottleneck detection." },
      { property: "og:title", content: "Picking & Packing — WareMind" },
      { property: "og:description", content: "Optimised pick routes, packing queue and bottleneck detection." },
    ],
  }),
  component: PickingPage,
});

function PickingPage() {
  const { orders, products, throughput, advanceOrder, rebalanceWorkers } = useWarehouse();
  const picking = orders.filter((o) => o.stage === "Picking" || o.stage === "Stock Allocated");
  const packing = orders.filter((o) => o.stage === "Packing" || o.stage === "Quality Check");
  const bottleneck = detectBottleneck(throughput);

  return (
    <div>
      <PageHeader
        title="Picking & Packing Control"
        description="Pick routes are sequenced by zone and bin to minimise travel, then handed to packing and quality check."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="p-5 xl:col-span-2">
          <SectionTitle title="Pick lists" subtitle={`${picking.length} order(s) ready to pick`} icon={<PackageCheck className="size-5" />} />
          {picking.length === 0 ? (
            <EmptyState title="No orders awaiting picking" hint="Allocate stock to release orders into picking." />
          ) : (
            <div className="space-y-3">
              {picking.map((o) => {
                const route = o.lines
                  .map((l) => products.find((p) => p.id === l.productId))
                  .filter(Boolean)
                  .sort((a, b) => (a!.location < b!.location ? -1 : 1));
                return (
                  <div key={o.id} className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm">{o.id}</span>
                      <span className="font-medium">{o.customer}</span>
                      <PriorityBadge priority={o.priority} />
                      <span className="ml-auto text-xs text-muted-foreground">Stage: {o.stage}</span>
                    </div>
                    <ol className="mt-3 space-y-1 text-xs">
                      {route.map((p, i) => {
                        const line = o.lines.find((l) => l.productId === p!.id)!;
                        return (
                          <li key={p!.id} className="flex items-center gap-2 rounded-lg bg-background/30 px-2 py-1">
                            <span className="grid size-5 place-items-center rounded-md bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                              {i + 1}
                            </span>
                            <span className="font-mono">{p!.location}</span>
                            <span>{p!.name}</span>
                            <span className="ml-auto text-muted-foreground">pick {line.allocated || line.quantity}</span>
                          </li>
                        );
                      })}
                    </ol>
                    <button
                      onClick={() => {
                        advanceOrder(o.id);
                        toast.success(`${o.id} pick confirmed`);
                      }}
                      className="mt-3 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      Confirm pick
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <SectionTitle title="Packing queue" subtitle={`${packing.length} order(s)`} />
            {packing.length === 0 ? (
              <EmptyState title="Packing queue empty" />
            ) : (
              <ul className="space-y-2">
                {packing.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{o.id}</span>
                    <span className="text-xs text-muted-foreground">{o.stage}</span>
                    <button
                      onClick={() => {
                        advanceOrder(o.id);
                        toast.success(`${o.id} moved forward`);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                    >
                      Next stage
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle title="Throughput & bottleneck" subtitle="Worker rebalancing" />
            <div className="space-y-2">
              {throughput.map((t) => (
                <div key={t.stage}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t.stage}</span>
                    <span className="font-medium">{t.ordersPerHour}/hr · {t.workers}w</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.min(100, t.ordersPerHour / 1.5)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {bottleneck ? (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3">
                <p className="text-sm font-medium text-warning">Bottleneck: {bottleneck.stage}</p>
                <p className="mt-1 text-xs text-muted-foreground">{bottleneck.recommendation}</p>
                <button
                  onClick={() => {
                    rebalanceWorkers(bottleneck.donorStage, bottleneck.stage);
                    toast.success("Workers rebalanced", {
                      description: `1 worker moved from ${bottleneck.donorStage} to ${bottleneck.stage}.`,
                    });
                  }}
                  className="mt-3 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Apply rebalance
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">Throughput balanced across stages.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
