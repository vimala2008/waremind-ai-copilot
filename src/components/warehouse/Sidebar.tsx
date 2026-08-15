import { Link, useRouterState } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { navItems } from "./nav";
import { cn } from "@/lib/utils";
import { useWarehouse } from "@/state/warehouse-store";

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { health, exceptions } = useWarehouse();
  const openExceptions = exceptions.filter((e) => !e.resolved).length;

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-5 backdrop-blur-xl lg:flex">
      <Link to="/" className="group flex items-center gap-3 px-2 pb-6">
        <span className="relative grid size-11 place-items-center rounded-xl bg-gradient-primary shadow-[0_12px_34px_-14px_oklch(0.5_0.24_268)]">
          <Radar className="size-6 text-primary-foreground transition-transform duration-500 group-hover:rotate-90" />
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary-glow/40" />
        </span>
        <span>
          <span className="block font-display text-lg font-bold leading-none tracking-tight">
            WARE<span className="text-gradient">MIND</span>
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Warehouse Copilot
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-all duration-200",
                "hover:translate-x-0.5 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                active && "bg-gradient-primary text-primary-foreground shadow-[0_10px_28px_-16px_oklch(0.5_0.24_268)]",
              )}
            >
              <Icon className={cn("size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110", active && "drop-shadow")} />
              <span className="truncate">{label}</span>
              {label === "Exceptions" && openExceptions > 0 ? (
                <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                  {openExceptions}
                </span>
              ) : null}
              {active ? <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary-foreground/80" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-sidebar-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Health score</span>
          <span className="font-semibold text-foreground">{health.score}/100</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all duration-700"
            style={{ width: `${health.score}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Deterministic decision engine active · mock dataset
        </p>
      </div>
    </aside>
  );
}
