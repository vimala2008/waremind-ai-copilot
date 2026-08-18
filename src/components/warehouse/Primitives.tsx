import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Priority, StockStatus } from "@/data/warehouse-data";

export function GlassCard({
  children,
  className,
  glow = false,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "glass hover-lift animate-rise rounded-2xl",
        glow && "glow-ring",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-[0_10px_30px_-12px_oklch(0.5_0.24_268)]">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="animate-rise">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

const statusStyles: Record<StockStatus, string> = {
  Healthy: "bg-success/15 text-success border-success/30",
  "Low Stock": "bg-warning/15 text-warning border-warning/30",
  Critical: "bg-destructive/15 text-destructive border-destructive/35",
  "Out of Stock": "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status }: { status: StockStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  Urgent: "bg-warning text-warning-foreground",
  Normal: "bg-primary text-primary-foreground",
  Low: "bg-secondary text-secondary-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    Low: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Severe: "bg-destructive text-destructive-foreground border-destructive",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", map[risk] ?? "bg-muted text-muted-foreground border-border")}>
      {risk}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Gauge({ score, size = 190 }: { score: number; size?: number }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="wm-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.58 0.22 262)" />
            <stop offset="100%" stopColor="oklch(0.86 0.15 197)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(0.75 0.07 265 / 18%)" strokeWidth="12" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#wm-gauge)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold leading-none kpi-number">{score}</div>
        <div className="text-xs text-muted-foreground">/ 100 health</div>
      </div>
    </div>
  );
}
