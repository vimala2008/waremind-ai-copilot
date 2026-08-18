import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useWarehouse } from "@/state/warehouse-store";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/10",
  high: "border-warning/35 bg-warning/10",
  medium: "border-primary/30 bg-primary/10",
  low: "border-border/70 bg-secondary/35",
};

export function CopilotPanel() {
  const { insights, applyInsight, activity } = useWarehouse();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="glass sticky top-20 hidden h-fit shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-4 text-xs text-muted-foreground hover:text-foreground xl:flex"
      >
        <Bot className="size-5 text-primary-glow" />
        <span className="[writing-mode:vertical-rl]">AI Copilot</span>
      </button>
    );
  }

  return (
    <aside className="glass cyan-ring sticky top-20 hidden h-[calc(100vh-6rem)] w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl xl:flex">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-primary cyan-ring">
          <Bot className="size-5 text-primary-glow drop-shadow-[0_0_8px_oklch(0.84_0.15_197/70%)]" />
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary-glow/40 animate-pulse-glow" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">AI Warehouse Copilot</p>
          <p className="text-[11px] text-muted-foreground">{insights.length} live recommendation(s)</p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse copilot"
          className="ml-auto grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {insights.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
            No open recommendations — operations are optimal.
          </p>
        ) : (
          insights.map((i) => (
            <div key={i.id} className={cn("rounded-2xl border p-3 hover-lift", severityStyles[i.severity])}>
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary-glow" />
                <span className="text-xs font-semibold">{i.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{Math.round(i.confidence * 100)}%</span>
              </div>
              <p className="mt-1.5 text-xs">{i.finding}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Why: {i.reason}</p>
              <p className="mt-1 text-[11px] text-primary-glow">Action: {i.recommendation}</p>
              <button
                onClick={() => {
                  const outcome = applyInsight(i);
                  toast.success("Copilot action applied", { description: outcome });
                }}
                className="mt-2 w-full rounded-lg bg-gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {i.action ? "Apply Recommendation" : "Acknowledge"}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border/70 px-3 py-3">
        <p className="pb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Activity</p>
        <ul className="max-h-28 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
          {activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex gap-2">
              <span className="font-mono text-[10px]">{a.at}</span>
              <span className="flex-1 text-foreground/80">{a.message}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/copilot"
          className="mt-3 block rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-center text-[11px] font-medium hover:text-foreground"
        >
          Open full copilot
        </Link>
      </div>
    </aside>
  );
}
