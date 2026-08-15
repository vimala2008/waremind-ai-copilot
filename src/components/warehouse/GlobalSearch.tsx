import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, Package, ClipboardList, MapPin } from "lucide-react";
import { useWarehouse } from "@/state/warehouse-store";
import {
  available,
  pendingOrdersForProduct,
  searchWarehouse,
  stockStatus,
  stockoutRisk,
} from "@/lib/warehouse-logic";
import { StatusPill, RiskBadge, PriorityBadge } from "./Primitives";

export function GlobalSearch() {
  const { products, orders } = useWarehouse();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const hits = useMemo(() => searchWarehouse(query, products, orders), [query, products, orders]);
  const showPanel = open && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary/50 px-3 py-2 transition-shadow focus-within:glow-ring">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, SKUs, order IDs, locations…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="glass absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl p-3">
            {hits.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No matching product or order found in the warehouse.
              </p>
            ) : (
              <ul className="space-y-2">
                {hits.map((hit) => {
                  if (hit.kind === "order") {
                    const order = orders.find((o) => o.id === hit.orderId)!;
                    return (
                      <li key={`o-${hit.orderId}`} className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="size-4 text-primary-glow" />
                          <span className="font-medium">{hit.title}</span>
                          <PriorityBadge priority={order.priority} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{hit.subtitle}</p>
                        <Link to="/orders" onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-medium text-primary-glow hover:underline">
                          Open in Orders →
                        </Link>
                      </li>
                    );
                  }
                  const product = products.find((p) => p.id === hit.productId)!;
                  const pending = pendingOrdersForProduct(product.id, orders);
                  return (
                    <li key={`p-${hit.kind}-${hit.productId}`} className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {hit.kind === "location" ? (
                          <MapPin className="size-4 text-primary-glow" />
                        ) : (
                          <Package className="size-4 text-primary-glow" />
                        )}
                        <span className="font-medium">{product.name}</span>
                        <StatusPill status={stockStatus(product)} />
                        <RiskBadge risk={stockoutRisk(product)} />
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                        <div><dt className="opacity-70">Stock</dt><dd className="font-medium text-foreground">{product.inStock}</dd></div>
                        <div><dt className="opacity-70">Available</dt><dd className="font-medium text-foreground">{available(product)}</dd></div>
                        <div><dt className="opacity-70">Location</dt><dd className="font-medium text-foreground">{product.location}</dd></div>
                        <div><dt className="opacity-70">SKU</dt><dd className="font-medium text-foreground">{product.sku}</dd></div>
                      </dl>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Pending orders:{" "}
                        {pending.length ? (
                          <span className="text-foreground">{pending.map((o) => o.id).join(", ")}</span>
                        ) : (
                          "none"
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
