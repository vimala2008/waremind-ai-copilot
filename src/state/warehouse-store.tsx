import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialWarehouseState,
  type Order,
  type Product,
  type StageThroughput,
  type WarehouseException,
} from "@/data/warehouse-data";
import {
  generateInsights,
  nextStage,
  warehouseHealth,
  type CopilotInsight,
} from "@/lib/warehouse-logic";

interface ActivityEntry {
  id: string;
  message: string;
  at: string;
}

interface WarehouseContextValue {
  products: Product[];
  orders: Order[];
  exceptions: WarehouseException[];
  throughput: StageThroughput[];
  insights: CopilotInsight[];
  health: ReturnType<typeof warehouseHealth>;
  activity: ActivityEntry[];
  allocate: (orderId: string, productId: string, quantity: number) => void;
  advanceOrder: (orderId: string) => void;
  resolveException: (exceptionId: string) => void;
  rebalanceWorkers: (from: string, to: string) => void;
  applySimulation: (productId: string, delta: number) => void;
  applyInsight: (insight: CopilotInsight) => string;
  logActivity: (message: string) => void;
}

const WarehouseContext = createContext<WarehouseContextValue | null>(null);

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialWarehouseState);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    { id: "seed-1", message: "WareMind copilot online — warehouse telemetry synced.", at: now() },
  ]);

  const logActivity = useCallback((message: string) => {
    setActivity((a) => [{ id: `${Date.now()}-${Math.random()}`, message, at: now() }, ...a].slice(0, 40));
  }, []);

  const allocate = useCallback(
    (orderId: string, productId: string, quantity: number) => {
      setState((s) => {
        const product = s.products.find((p) => p.id === productId);
        const order = s.orders.find((o) => o.id === orderId);
        if (!product || !order) return s;
        const line = order.lines.find((l) => l.productId === productId);
        if (!line) return s;
        const free = Math.max(0, product.inStock - product.reserved);
        const qty = Math.min(quantity, free, line.quantity - line.allocated);
        if (qty <= 0) return s;

        return {
          ...s,
          products: s.products.map((p) =>
            p.id === productId ? { ...p, reserved: p.reserved + qty } : p,
          ),
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const lines = o.lines.map((l) =>
              l.productId === productId ? { ...l, allocated: l.allocated + qty } : l,
            );
            const fully = lines.every((l) => l.allocated >= l.quantity);
            return {
              ...o,
              lines,
              status: fully ? "In Process" : "Partially Allocated",
              stage: fully && o.stage === "Inventory Checked" ? "Stock Allocated" : o.stage,
            } as Order;
          }),
          exceptions: s.exceptions.map((e) =>
            e.type === "Stock shortage" && e.orderId === orderId && e.productId === productId
              ? { ...e, resolved: true }
              : e,
          ),
        };
      });
      logActivity(`Allocated ${quantity} unit(s) of ${productId} to ${orderId}.`);
    },
    [logActivity],
  );

  const advanceOrder = useCallback(
    (orderId: string) => {
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          if (o.stage === "Dispatch") return { ...o, status: "Dispatched" as const };
          const stage = nextStage(o.stage);
          return {
            ...o,
            stage,
            status: stage === "Dispatch" ? ("In Process" as const) : ("In Process" as const),
          };
        }),
      }));
      logActivity(`${orderId} advanced to the next workflow stage.`);
    },
    [logActivity],
  );

  const resolveException = useCallback(
    (exceptionId: string) => {
      setState((s) => ({
        ...s,
        exceptions: s.exceptions.map((e) => (e.id === exceptionId ? { ...e, resolved: true } : e)),
      }));
      logActivity(`Exception ${exceptionId} resolved.`);
    },
    [logActivity],
  );

  const rebalanceWorkers = useCallback(
    (from: string, to: string) => {
      setState((s) => ({
        ...s,
        throughput: s.throughput.map((t) => {
          if (t.stage === from && t.workers > 1) {
            return {
              ...t,
              workers: t.workers - 1,
              ordersPerHour: Math.round(t.ordersPerHour * (1 - 1 / t.workers)),
            };
          }
          if (t.stage === to) {
            return {
              ...t,
              workers: t.workers + 1,
              ordersPerHour: Math.round(t.ordersPerHour * (1 + 1 / t.workers)),
            };
          }
          return t;
        }),
      }));
      logActivity(`Reallocated 1 worker from ${from} to ${to}.`);
    },
    [logActivity],
  );

  const applySimulation = useCallback(
    (productId: string, delta: number) => {
      setState((s) => ({
        ...s,
        products: s.products.map((p) =>
          p.id === productId ? { ...p, inStock: Math.max(0, p.inStock + delta) } : p,
        ),
      }));
      logActivity(`Simulation applied to ${productId} (${delta > 0 ? "+" : ""}${delta} units).`);
    },
    [logActivity],
  );

  const applyInsight = useCallback(
    (insight: CopilotInsight) => {
      const a = insight.action;
      if (!a) return "Recommendation acknowledged and logged for the shift report.";
      switch (a.type) {
        case "allocate":
          allocate(a.orderId, a.productId, a.quantity);
          return `Allocated ${a.quantity} unit(s) to ${a.orderId}.`;
        case "resolveException":
          resolveException(a.exceptionId);
          return `Exception ${a.exceptionId} resolved.`;
        case "rebalance":
          rebalanceWorkers(a.from, a.to);
          return `Moved 1 worker from ${a.from} to ${a.to}.`;
        case "advance":
          advanceOrder(a.orderId);
          return `${a.orderId} pushed forward in the workflow.`;
      }
    },
    [allocate, resolveException, rebalanceWorkers, advanceOrder],
  );

  const insights = useMemo(
    () => generateInsights(state.products, state.orders, state.exceptions, state.throughput),
    [state],
  );
  const health = useMemo(
    () => warehouseHealth(state.products, state.orders, state.exceptions, state.throughput),
    [state],
  );

  const value: WarehouseContextValue = {
    ...state,
    insights,
    health,
    activity,
    allocate,
    advanceOrder,
    resolveException,
    rebalanceWorkers,
    applySimulation,
    applyInsight,
    logActivity,
  };

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouse must be used inside WarehouseProvider");
  return ctx;
}
