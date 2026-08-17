import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Radar, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { navItems } from "./nav";
import { useWarehouse } from "@/state/warehouse-store";
import { useVoice } from "@/state/voice-store";
import { cn } from "@/lib/utils";

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { exceptions, insights, health } = useWarehouse();
  const { muted, toggleMuted } = useVoice();
  const [now, setNow] = useState<Date | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const open = exceptions.filter((e) => !e.resolved);
  const status = health.score >= 80 ? "Optimal" : health.score >= 60 ? "Strained" : "At Risk";
  const statusTone =
    health.score >= 80
      ? "border-success/35 bg-success/12 text-success"
      : health.score >= 60
        ? "border-warning/35 bg-warning/12 text-warning"
        : "border-destructive/40 bg-destructive/12 text-destructive";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="grid size-9 place-items-center rounded-xl border border-border bg-secondary/50 lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary">
            <Radar className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-sm font-bold">WAREMIND</span>
        </Link>

        <div className="order-last w-full min-w-0 flex-1 sm:order-none sm:w-auto">
          <GlobalSearch />
        </div>

        <span className={cn("hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium md:inline-flex", statusTone)}>
          <ShieldCheck className="size-3.5" />
          Warehouse {status} · {health.score}/100
        </span>

        <button
          onClick={toggleMuted}
          aria-label={muted ? "Unmute voice" : "Mute voice"}
          className="grid size-9 place-items-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="size-4" />
            {open.length > 0 ? (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {open.length}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="glass absolute right-0 top-11 w-80 rounded-2xl p-3 text-sm shadow-2xl">
              <p className="px-1 pb-2 text-xs uppercase tracking-wide text-muted-foreground">Live alerts</p>
              <ul className="space-y-2">
                {[...open.map((e) => `${e.type}: ${e.detail}`), ...insights.slice(0, 3).map((i) => i.finding)]
                  .slice(0, 6)
                  .map((text, i) => (
                    <li key={i} className="rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-xs">
                      {text}
                    </li>
                  ))}
                {open.length === 0 && insights.length === 0 ? (
                  <li className="px-1 text-xs text-muted-foreground">No active alerts.</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="hidden text-right text-xs leading-tight text-muted-foreground sm:block">
          <div className="font-medium text-foreground">
            {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
          </div>
          <div>{now ? now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" }) : ""}</div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-2 py-1.5">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-primary text-[11px] font-bold text-primary-foreground">
            AV
          </span>
          <span className="hidden text-xs leading-tight md:block">
            <span className="block font-medium">Aarav Verma</span>
            <span className="text-muted-foreground">Shift Supervisor</span>
          </span>
        </div>
      </div>

      {menuOpen ? (
        <nav className="grid grid-cols-2 gap-1.5 border-t border-border/70 px-4 py-3 lg:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground",
                pathname === to && "bg-gradient-primary text-primary-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
