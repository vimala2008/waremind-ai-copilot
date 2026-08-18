import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  ClipboardList,
  Gauge as GaugeIcon,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { GlassCard, Gauge, PageHeader, PriorityBadge, SectionTitle, StatusPill } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import {
  available,
  detectBottleneck,
  orderAllocated,
  orderQuantity,
  stageCounts,
  stockStatus,
} from "@/lib/warehouse-logic";
import { WORKFLOW_STAGES } from "@/data/warehouse-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Warehouse Operations & Order Fulfillment System" },
      {
        name: "description",
        content:
          "Live warehouse health, order pipeline, inventory risk and AI copilot decisions in one command center.",
      },
      { property: "og:title", content: "Smart Warehouse Operations & Order Fulfillment System" },
      {
        property: "og:description",
        content: "Live warehouse health, order pipeline and AI-driven fulfilment decisions.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { products, orders, exceptions, throughput, health, insights, activity } = useWarehouse();
  const openExceptions = exceptions.filter((e) => !e.resolved);
  const blocked = orders.filter((o) => o.status === "Blocked");
  const lowStock = products.filter((p) => stockStatus(p) !== "Healthy");
  const bottleneck = detectBottleneck(throughput);
  const counts = stageCounts(orders);
  const maxStage = Math.max(1, ...counts.map((c) => c.count));

  const kpis = [
    { label: "Active orders", value: orders.filter((o) => o.status !== "Dispatched").length, icon: ClipboardList, hint: `${blocked.length} blocked` },
    { label: "SKUs tracked", value: products.length, icon: Boxes, hint: `${lowStock.length} need attention` },
    { label: "Open exceptions", value: openExceptions.length, icon: TriangleAlert, hint: "auto-triaged by copilot" },
    { label: "Dispatch ready", value: orders.filter((o) => o.stage === "Dispatch").length, icon: Truck, hint: "awaiting carrier scan" },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouse Command Center"
        description="Deterministic decision engine monitoring inventory, orders, throughput and exceptions in real time."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 70} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className="mt-2 font-display text-3xl font-bold kpi-number animate-count-in">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary/60 text-primary-glow shadow-[0_0_18px_-4px_oklch(0.84_0.15_197/45%)]">
                <kpi.icon className="size-5" />
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard glow className="p-5 xl:col-span-1">
          <SectionTitle title="Warehouse health" subtitle="Composite operational score" icon={<GaugeIcon className="size-5" />} />
          <div className="flex flex-col items-center gap-4">
            <Gauge score={health.score} />
            <div className="w-full space-y-2">
              {health.factors.map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">{f.score}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-cyan transition-all duration-700" style={{ width: `${f.score}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4 xl:col-span-2">
          <GlassCard className="p-5">
            <SectionTitle
              title="Order pipeline"
              subtitle="Live distribution across the fulfilment workflow"
              icon={<ClipboardList className="size-5" />}
              action={
                <Link to="/orders" className="text-xs font-medium text-primary-glow hover:underline">
                  Open orders →
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WORKFLOW_STAGES.map((stage) => {
                const count = counts.find((c) => c.stage === stage)?.count ?? 0;
                return (
                  <div key={stage} className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stage}</p>
                    <p className="mt-1 font-display text-2xl font-bold kpi-number animate-count-in">{count}</p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-cyan" style={{ width: `${(count / maxStage) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle
              title="Top copilot recommendations"
              subtitle="Deterministic reasoning over live warehouse state"
              icon={<Activity className="size-5" />}
              action={
                <Link to="/copilot" className="text-xs font-medium text-primary-glow hover:underline">
                  Open copilot →
                </Link>
              }
            />
            <ul className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <li key={insight.id} className="rounded-xl border border-border/70 bg-secondary/40 p-3">
                  <p className="font-medium">{insight.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.finding}</p>
                  <p className="mt-1 text-xs text-primary-glow">{insight.recommendation}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard className="p-5 xl:col-span-2">
          <SectionTitle
            title="Priority queue"
            subtitle="Highest-weighted orders needing action"
            icon={<Truck className="size-5" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2 pr-3">Customer</th>
                  <th className="pb-2 pr-3">Priority</th>
                  <th className="pb-2 pr-3">Progress</th>
                  <th className="pb-2">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter((o) => o.status !== "Dispatched")
                  .slice(0, 6)
                  .map((o) => (
                    <tr key={o.id} className="border-t border-border/60">
                      <td className="py-2 pr-3 font-mono text-xs">{o.id}</td>
                      <td className="py-2 pr-3">{o.customer}</td>
                      <td className="py-2 pr-3"><PriorityBadge priority={o.priority} /></td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {orderAllocated(o)}/{orderQuantity(o)} allocated
                      </td>
                      <td className="py-2 text-xs">{o.deadline}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <SectionTitle title="Bottleneck radar" subtitle="Throughput analysis" />
            {bottleneck ? (
              <div>
                <p className="font-medium">{bottleneck.stage}</p>
                <p className="mt-1 text-xs text-muted-foreground">{bottleneck.recommendation}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Throughput balanced across all stages.</p>
            )}
            <div className="mt-4 space-y-2">
              {throughput.map((t) => (
                <div key={t.stage} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t.stage}</span>
                  <span className="font-medium">{t.ordersPerHour}/hr · {t.workers} workers</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle title="Inventory watchlist" subtitle="SKUs below threshold" />
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-sm">
                  <span>{p.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {available(p)} avail
                    <StatusPill status={stockStatus(p)} />
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionTitle title="Live activity" subtitle="Latest engine events" />
            <ul className="space-y-2">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-2 text-xs">
                  <span className="font-mono text-muted-foreground">{a.at}</span>
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
