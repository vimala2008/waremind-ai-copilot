import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes } from "lucide-react";
import { GlassCard, PageHeader, RiskBadge, SectionTitle, StatusPill } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { available, pendingOrdersForProduct, stockStatus, stockoutRisk } from "@/lib/warehouse-logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Smart Warehouse Operations & Order Fulfillment System" },
      { name: "description", content: "SKU-level stock levels, bin locations, availability and stockout risk scoring." },
      { property: "og:title", content: "Inventory — Smart Warehouse Operations & Order Fulfillment System" },
      { property: "og:description", content: "SKU stock levels, bin locations and stockout risk scoring." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { products, orders } = useWarehouse();
  const [zone, setZone] = useState("All");
  const zones = ["All", ...Array.from(new Set(products.map((p) => p.zone)))];
  const list = products.filter((p) => zone === "All" || p.zone === zone);

  return (
    <div>
      <PageHeader
        title="Inventory Intelligence"
        description="Real-time stock, reservations and bin locations with deterministic risk scoring per SKU."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors",
              zone === z ? "bg-gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {z}
          </button>
        ))}
      </div>

      <GlassCard className="p-5">
        <SectionTitle title="Stock ledger" subtitle={`${list.length} SKUs`} icon={<Boxes className="size-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2 pr-3">SKU</th>
                <th className="pb-2 pr-3">Location</th>
                <th className="pb-2 pr-3">Stock</th>
                <th className="pb-2 pr-3">Reserved</th>
                <th className="pb-2 pr-3">Available</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Risk</th>
                <th className="pb-2">Pending orders</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="py-2 pr-3">{p.name}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{p.sku}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{p.location}</td>
                  <td className="py-2 pr-3">{p.inStock}</td>
                  <td className="py-2 pr-3">{p.reserved}</td>
                  <td className="py-2 pr-3 font-medium">{available(p)}</td>
                  <td className="py-2 pr-3"><StatusPill status={stockStatus(p)} /></td>
                  <td className="py-2 pr-3"><RiskBadge risk={stockoutRisk(p)} /></td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {pendingOrdersForProduct(p.id, orders).map((o) => o.id).join(", ") || "none"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
