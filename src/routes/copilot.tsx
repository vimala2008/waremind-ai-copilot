import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Send } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, GlassCard, PageHeader, SectionTitle } from "@/components/warehouse/Primitives";
import { useWarehouse } from "@/state/warehouse-store";
import { searchWarehouse, available, stockStatus, stockoutRisk } from "@/lib/warehouse-logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "AI Copilot — WareMind" },
      { name: "description", content: "Ask the warehouse copilot about stock, orders and bottlenecks and apply its recommendations instantly." },
      { property: "og:title", content: "AI Copilot — WareMind" },
      { property: "og:description", content: "Deterministic warehouse reasoning with one-click actions." },
    ],
  }),
  component: CopilotPage,
});

const severityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/10",
  high: "border-warning/35 bg-warning/10",
  medium: "border-primary/30 bg-primary/10",
  low: "border-border/70 bg-secondary/35",
};

interface Msg {
  id: string;
  role: "user" | "copilot";
  text: string;
}

function CopilotPage() {
  const { insights, applyInsight, products, orders, health } = useWarehouse();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "seed",
      role: "copilot",
      text: "WareMind copilot online. Ask me about a SKU, an order, stock risk or the current bottleneck — I reason over live warehouse state.",
    },
  ]);

  const suggestions = useMemo(
    () => ["Where is P-1001?", "Show blocked orders", "What is the warehouse health?", "Which SKUs are at risk?"],
    [],
  );

  function answer(question: string): string {
    const q = question.toLowerCase();
    if (q.includes("health")) {
      return `Warehouse health is ${health.score}/100. Weakest factors: ${[...health.factors]
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
        .map((f) => `${f.label} (${f.score})`)
        .join(", ")}.`;
    }
    if (q.includes("blocked")) {
      const blocked = orders.filter((o) => o.status === "Blocked");
      return blocked.length
        ? `${blocked.length} blocked order(s): ${blocked.map((o) => `${o.id} (${o.priority}, due ${o.deadline})`).join("; ")}. Run smart allocation to release them.`
        : "No orders are currently blocked.";
    }
    if (q.includes("risk")) {
      const risky = products.filter((p) => ["High", "Severe"].includes(stockoutRisk(p)));
      return risky.length
        ? `At-risk SKUs: ${risky.map((p) => `${p.name} (${available(p)} available, ${stockoutRisk(p)} risk)`).join("; ")}.`
        : "No SKU is currently at high stockout risk.";
    }
    if (q.includes("bottleneck")) {
      const b = insights.find((i) => i.kind === "bottleneck");
      return b ? `${b.finding} ${b.recommendation}` : "Throughput is balanced across all stages.";
    }
    const hits = searchWarehouse(question, products, orders);
    if (hits.length) {
      return hits
        .slice(0, 3)
        .map((h) => `${h.title} — ${h.subtitle}`)
        .join(" | ");
    }
    const product = products.find((p) => q.includes(p.name.toLowerCase()) || q.includes(p.id.toLowerCase()));
    if (product) {
      return `${product.name} is in ${product.location} (${product.zone}) with ${available(product)} available — status ${stockStatus(product)}.`;
    }
    return "I could not match that to a product, order or metric. Try a SKU, order ID, 'blocked orders', 'risk', 'bottleneck' or 'health'.";
  }

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}-u`, role: "user", text: question },
      { id: `${Date.now()}-c`, role: "copilot", text: answer(question) },
    ]);
    setInput("");
  }

  return (
    <div>
      <PageHeader
        title="AI Copilot"
        description="Deterministic reasoning over live warehouse state — findings, why they matter and one-click actions. Ready to be swapped for an LLM later."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="flex h-[560px] flex-col p-5">
          <SectionTitle title="Ask the copilot" subtitle="Natural-language warehouse queries" icon={<Bot className="size-5" />} />
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[92%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-gradient-primary text-primary-foreground"
                    : "border border-border/70 bg-secondary/40",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-input bg-secondary/50 px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a SKU, order or bottleneck…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="Send" className="text-primary-glow hover:text-foreground">
              <Send className="size-4" />
            </button>
          </form>
        </GlassCard>

        <div className="space-y-4 xl:col-span-2">
          <GlassCard className="p-5">
            <SectionTitle title="Decision feed" subtitle={`${insights.length} recommendation(s) from live state`} />
            {insights.length === 0 ? (
              <EmptyState title="No recommendations" hint="The warehouse is fully optimised." />
            ) : (
              <div className="space-y-3">
                {insights.map((i) => (
                  <div key={i.id} className={cn("rounded-2xl border p-4", severityStyles[i.severity])}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{i.title}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {i.kind}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {Math.round(i.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{i.finding}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Why: {i.reason}</p>
                    <p className="mt-1 text-xs text-primary-glow">Action: {i.recommendation}</p>
                    <button
                      onClick={() => {
                        const outcome = applyInsight(i);
                        toast.success("Copilot action applied", { description: outcome });
                      }}
                      className="mt-3 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                    >
                      {i.action ? "Apply recommendation" : "Acknowledge"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
