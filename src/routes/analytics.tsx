import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, PageHeader, SectionTitle } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { exceptionTrend, fulfillmentTrend } from "@/data/warehouse-data";
import { stageCounts, stockStatus } from "@/lib/warehouse-logic";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — WareMind" },
      { name: "description", content: "Fulfilment trends, exception breakdown, stage load and inventory status distribution." },
      { property: "og:title", content: "Analytics — WareMind" },
      { property: "og:description", content: "Fulfilment trends, exception breakdown and inventory distribution." },
    ],
  }),
  component: AnalyticsPage,
});

const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function AnalyticsPage() {
  const { orders, products, throughput } = useWarehouse();

  const statusData = ["Healthy", "Low Stock", "Critical", "Out of Stock"].map((s, i) => ({
    name: s,
    value: products.filter((p) => stockStatus(p) === s).length,
    fill: CHART[i],
  }));

  const stageData = stageCounts(orders).map((s) => ({ stage: s.stage.replace(" ", "\n"), count: s.count }));

  return (
    <div>
      <PageHeader
        title="Operational Analytics"
        description="Trend analysis across fulfilment, exceptions, stage load and inventory health."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="p-5">
          <SectionTitle title="Fulfilment vs target" subtitle="Last 7 days" icon={<BarChart3 className="size-5" />} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fulfillmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="fulfilled" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.28} />
                <Area type="monotone" dataKey="target" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Exception breakdown" subtitle="Type mix over the week" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="damaged" stackId="a" fill="var(--chart-5)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="missing" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="shortage" stackId="a" fill="var(--chart-1)" />
                <Bar dataKey="delays" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Inventory status mix" subtitle="Current SKU distribution" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionTitle title="Stage load & throughput" subtitle="Orders per stage vs hourly capacity" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={9} interval={0} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughput}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ordersPerHour" stroke="var(--chart-3)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
