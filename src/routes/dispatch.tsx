import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GlassCard, PageHeader, PriorityBadge, SectionTitle } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { orderQuantity } from "@/lib/warehouse-logic";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch — Smart Warehouse Operations & Order Fulfillment System" },
      { name: "description", content: "Dispatch-ready orders, carrier handover confirmation and shipped order log." },
      { property: "og:title", content: "Dispatch — Smart Warehouse Operations & Order Fulfillment System" },
      { property: "og:description", content: "Dispatch-ready orders and carrier handover confirmation." },
    ],
  }),
  component: DispatchPage,
});

function DispatchPage() {
  const { orders, advanceOrder } = useWarehouse();
  const ready = orders.filter((o) => o.stage === "Dispatch" && o.status !== "Dispatched");
  const shipped = orders.filter((o) => o.status === "Dispatched");

  return (
    <div>
      <PageHeader
        title="Dispatch Control Tower"
        description="Final handover: orders that cleared quality check are staged, weighed and released to carriers."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5">
          <SectionTitle title="Ready to dispatch" subtitle={`${ready.length} order(s) staged`} icon={<Truck className="size-5" />} />
          {ready.length === 0 ? (
            <EmptyState title="No orders staged for dispatch" hint="Advance orders through quality check first." />
          ) : (
            <div className="space-y-3">
              {ready.map((o) => (
                <div key={o.id} className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{o.id}</span>
                    <span className="font-medium">{o.customer}</span>
                    <PriorityBadge priority={o.priority} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {orderQuantity(o)} units · due {o.deadline}
                  </p>
                  <button
                    onClick={() => {
                      advanceOrder(o.id);
                      toast.success(`${o.id} dispatched`, { description: "Carrier handover recorded." });
                    }}
                    className="mt-3 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    Confirm dispatch
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Dispatched today" subtitle={`${shipped.length} order(s) shipped`} />
          {shipped.length === 0 ? (
            <EmptyState title="Nothing dispatched yet" hint="Confirm a staged order to see it here." />
          ) : (
            <ul className="space-y-2">
              {shipped.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{o.id}</span>
                  <span>{o.customer}</span>
                  <span className="text-xs text-success">Dispatched</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
