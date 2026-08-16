import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, PageHeader, PriorityBadge, SectionTitle, EmptyState } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { orderAllocated, orderQuantity, priorityWeight } from "@/lib/warehouse-logic";
import { WORKFLOW_STAGES, type Priority } from "@/data/warehouse-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — WareMind" },
      { name: "description", content: "Priority-ranked order queue with live workflow stages and allocation progress." },
      { property: "og:title", content: "Orders — WareMind" },
      { property: "og:description", content: "Priority-ranked order queue with live workflow stages." },
    ],
  }),
  component: OrdersPage,
});

const filters = ["All", "Critical", "Urgent", "Normal", "Low"] as const;

function OrdersPage() {
  const { orders, products, advanceOrder } = useWarehouse();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const list = orders
    .filter((o) => filter === "All" || o.priority === (filter as Priority))
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return (
    <div>
      <PageHeader
        title="Order Fulfillment Queue"
        description="Orders are ranked by deterministic priority weighting, then pushed through the eight-stage fulfilment workflow."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f ? "bg-gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <GlassCard className="p-5">
        <SectionTitle title="Live orders" subtitle={`${list.length} orders in view`} icon={<ClipboardList className="size-5" />} />
        {list.length === 0 ? (
          <EmptyState title="No orders match this filter" hint="Try a different priority band." />
        ) : (
          <div className="space-y-3">
            {list.map((o) => {
              const stageIdx = WORKFLOW_STAGES.indexOf(o.stage);
              return (
                <div key={o.id} className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{o.id}</span>
                    <span className="font-medium">{o.customer}</span>
                    <PriorityBadge priority={o.priority} />
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{o.status}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Due {o.deadline}</span>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {o.lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      return (
                        <div key={l.productId} className="flex items-center justify-between rounded-lg bg-background/30 px-2 py-1">
                          <span>{p?.name ?? l.productId}</span>
                          <span className={cn("font-medium", l.allocated >= l.quantity ? "text-success" : "text-warning")}>
                            {l.allocated}/{l.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {WORKFLOW_STAGES.map((s, i) => (
                      <span
                        key={s}
                        title={s}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i <= stageIdx ? "bg-gradient-primary" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Stage: <span className="text-foreground">{o.stage}</span> · {orderAllocated(o)}/{orderQuantity(o)} units allocated
                    </p>
                    <button
                      onClick={() => {
                        advanceOrder(o.id);
                        toast.success(`${o.id} advanced`, { description: "Workflow stage updated by the decision engine." });
                      }}
                      className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      Advance stage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
