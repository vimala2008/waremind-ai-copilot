import { createFileRoute } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GlassCard, PageHeader, SectionTitle } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exceptions")({
  head: () => ({
    meta: [
      { title: "Exceptions — WareMind" },
      { name: "description", content: "Damaged, missing, shortage and delay exceptions with engine decisions and resolutions." },
      { property: "og:title", content: "Exceptions — WareMind" },
      { property: "og:description", content: "Exception triage with deterministic decisions and resolutions." },
    ],
  }),
  component: ExceptionsPage,
});

const severityStyles: Record<string, string> = {
  high: "border-destructive/35 bg-destructive/10",
  medium: "border-warning/30 bg-warning/10",
  low: "border-border/70 bg-secondary/35",
};

function ExceptionsPage() {
  const { exceptions, resolveException } = useWarehouse();
  const open = exceptions.filter((e) => !e.resolved);
  const resolved = exceptions.filter((e) => e.resolved);

  return (
    <div>
      <PageHeader
        title="Exception Handling"
        description="Every exception is classified, given a deterministic decision path and a concrete resolution the floor team can execute."
      />

      <GlassCard className="p-5">
        <SectionTitle title="Open exceptions" subtitle={`${open.length} awaiting action`} icon={<TriangleAlert className="size-5" />} />
        {open.length === 0 ? (
          <EmptyState title="No open exceptions" hint="The warehouse is running clean." />
        ) : (
          <div className="space-y-3">
            {open.map((e) => (
              <div key={e.id} className={cn("rounded-2xl border p-4", severityStyles[e.severity])}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{e.id}</span>
                  <span className="font-medium">{e.type}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {e.severity}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{e.raisedAt}</span>
                </div>
                <p className="mt-2 text-sm">{e.detail}</p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-background/30 px-3 py-2">
                    <p className="text-muted-foreground">Engine decision</p>
                    <p className="mt-0.5">{e.decision}</p>
                  </div>
                  <div className="rounded-lg bg-background/30 px-3 py-2">
                    <p className="text-muted-foreground">Resolution</p>
                    <p className="mt-0.5">{e.resolution}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {e.orderId ? `Order ${e.orderId}` : "No linked order"}
                  {e.productId ? ` · Product ${e.productId}` : ""}
                </p>
                <button
                  onClick={() => {
                    resolveException(e.id);
                    toast.success(`${e.id} resolved`, { description: e.resolution });
                  }}
                  className="mt-3 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Apply resolution
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="mt-4 p-5">
        <SectionTitle title="Resolved" subtitle={`${resolved.length} closed`} />
        {resolved.length === 0 ? (
          <EmptyState title="Nothing resolved yet" />
        ) : (
          <ul className="space-y-2">
            {resolved.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm">
                <span className="font-mono text-xs">{e.id}</span>
                <span>{e.type}</span>
                <span className="ml-auto text-xs text-success">{e.resolution}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
