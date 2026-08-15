/**
 * Deterministic warehouse decision logic.
 * Pure functions only — no UI, no data source coupling.
 * This is the layer that would later be augmented by an LLM API.
 */
import {
  WORKFLOW_STAGES,
  type Order,
  type Priority,
  type Product,
  type Stage,
  type StageThroughput,
  type StockStatus,
  type WarehouseException,
} from "@/data/warehouse-data";

export const available = (p: Product) => Math.max(0, p.inStock - p.reserved);

export function stockStatus(p: Product): StockStatus {
  if (p.inStock <= 0) return "Out of Stock";
  const avail = available(p);
  if (avail <= 0) return "Critical";
  if (avail < p.minStock * 0.5) return "Critical";
  if (avail < p.minStock) return "Low Stock";
  return "Healthy";
}

export type RiskLevel = "Low" | "Medium" | "High" | "Severe";

export function stockoutRisk(p: Product): RiskLevel {
  const avail = available(p);
  if (p.inStock === 0) return "Severe";
  const ratio = p.minStock === 0 ? 2 : avail / p.minStock;
  if (ratio >= 1) return "Low";
  if (ratio >= 0.6) return "Medium";
  if (ratio > 0) return "High";
  return "Severe";
}

export const priorityWeight: Record<Priority, number> = {
  Critical: 4,
  Urgent: 3,
  Normal: 2,
  Low: 1,
};

export function orderQuantity(order: Order) {
  return order.lines.reduce((s, l) => s + l.quantity, 0);
}
export function orderAllocated(order: Order) {
  return order.lines.reduce((s, l) => s + l.allocated, 0);
}

export function stageIndex(stage: Stage) {
  return WORKFLOW_STAGES.indexOf(stage);
}

export function stageCounts(orders: Order[]) {
  return WORKFLOW_STAGES.map((stage) => ({
    stage,
    count: orders.filter((o) => o.stage === stage).length,
  }));
}

export interface HealthFactor {
  label: string;
  score: number;
  detail: string;
}

export function warehouseHealth(
  products: Product[],
  orders: Order[],
  exceptions: WarehouseException[],
  throughput: StageThroughput[],
) {
  const healthy = products.filter((p) => stockStatus(p) === "Healthy").length;
  const inventoryHealth = Math.round((healthy / Math.max(1, products.length)) * 100);

  const dispatched = orders.filter((o) => o.status === "Dispatched").length;
  const blocked = orders.filter((o) => o.status === "Blocked").length;
  const fulfillment = Math.round(
    Math.max(0, 100 - (blocked / Math.max(1, orders.length)) * 140 + dispatched * 2),
  );

  const pick = throughput.find((t) => t.stage === "Picking")?.ordersPerHour ?? 1;
  const pack = throughput.find((t) => t.stage === "Packing")?.ordersPerHour ?? 1;
  const disp = throughput.find((t) => t.stage === "Dispatch")?.ordersPerHour ?? 1;
  const peak = Math.max(pick, pack, disp);
  const pickingEfficiency = Math.round((pick / peak) * 100);
  const packingEfficiency = Math.round((pack / peak) * 100);

  const atRisk = products.filter((p) => ["High", "Severe"].includes(stockoutRisk(p))).length;
  const stockoutScore = Math.round(100 - (atRisk / Math.max(1, products.length)) * 100);

  const open = exceptions.filter((e) => !e.resolved).length;
  const exceptionScore = Math.round(100 - Math.min(100, open * 12));

  const factors: HealthFactor[] = [
    { label: "Inventory Health", score: clamp(inventoryHealth), detail: `${healthy}/${products.length} SKUs healthy` },
    { label: "Order Fulfillment", score: clamp(fulfillment), detail: `${blocked} blocked orders` },
    { label: "Picking Efficiency", score: clamp(pickingEfficiency), detail: `${pick} orders/hr` },
    { label: "Packing Efficiency", score: clamp(packingEfficiency), detail: `${pack} orders/hr` },
    { label: "Stockout Risk", score: clamp(stockoutScore), detail: `${atRisk} SKUs at risk` },
    { label: "Exception Rate", score: clamp(exceptionScore), detail: `${open} open exceptions` },
  ];

  const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  return { score: clamp(score), factors };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export interface Bottleneck {
  stage: string;
  ordersPerHour: number;
  recommendation: string;
  donorStage: string;
}

export function detectBottleneck(throughput: StageThroughput[]): Bottleneck | null {
  if (!throughput.length) return null;
  const sorted = [...throughput].sort((a, b) => a.ordersPerHour - b.ordersPerHour);
  const slowest = sorted[0];
  const fastest = sorted[sorted.length - 1];
  if (!slowest || !fastest || slowest.stage === fastest.stage) return null;
  return {
    stage: slowest.stage,
    ordersPerHour: slowest.ordersPerHour,
    donorStage: fastest.stage,
    recommendation: `Consider reallocating one worker from ${fastest.stage} to ${slowest.stage}. Projected ${slowest.stage} throughput: ${Math.round(slowest.ordersPerHour * (1 + 1 / Math.max(1, slowest.workers)))} orders/hour.`,
  };
}

/* ---------------- Allocation engine ---------------- */

export interface AllocationPlan {
  orderId: string;
  productId: string;
  productName: string;
  requested: number;
  availableNow: number;
  allocate: number;
  shortfall: number;
  priority: Priority;
}

export function buildAllocationPlans(products: Product[], orders: Order[]): AllocationPlan[] {
  const virtualAvail = new Map(products.map((p) => [p.id, available(p)]));
  const queue = [...orders]
    .filter((o) => o.status !== "Dispatched")
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  const plans: AllocationPlan[] = [];
  for (const order of queue) {
    for (const line of order.lines) {
      const outstanding = line.quantity - line.allocated;
      if (outstanding <= 0) continue;
      const product = products.find((p) => p.id === line.productId);
      if (!product) continue;
      const availNow = virtualAvail.get(product.id) ?? 0;
      const allocate = Math.min(outstanding, availNow);
      virtualAvail.set(product.id, availNow - allocate);
      plans.push({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        requested: outstanding,
        availableNow: availNow,
        allocate,
        shortfall: outstanding - allocate,
        priority: order.priority,
      });
    }
  }
  return plans;
}

/* ---------------- AI Copilot (deterministic reasoning) ---------------- */

export type InsightKind =
  | "shortage"
  | "prioritization"
  | "allocation"
  | "delay"
  | "exception"
  | "bottleneck"
  | "replenishment";

export interface CopilotInsight {
  id: string;
  kind: InsightKind;
  title: string;
  finding: string;
  reason: string;
  recommendation: string;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  action?:
    | { type: "allocate"; orderId: string; productId: string; quantity: number }
    | { type: "resolveException"; exceptionId: string }
    | { type: "rebalance"; from: string; to: string }
    | { type: "advance"; orderId: string };
}

export function generateInsights(
  products: Product[],
  orders: Order[],
  exceptions: WarehouseException[],
  throughput: StageThroughput[],
): CopilotInsight[] {
  const insights: CopilotInsight[] = [];
  const plans = buildAllocationPlans(products, orders);

  for (const plan of plans) {
    if (plan.shortfall > 0 && plan.allocate > 0) {
      insights.push({
        id: `shortage-${plan.orderId}-${plan.productId}`,
        kind: "shortage",
        title: `Inventory shortage detected — ${plan.orderId}`,
        finding: `Order ${plan.orderId} requires ${plan.requested} × ${plan.productName}. Only ${plan.availableNow} available.`,
        reason: `${plan.orderId} is flagged ${plan.priority}. Partial fulfilment protects the deadline while replenishment covers the remainder.`,
        recommendation: `Allocate ${plan.allocate} available units to ${plan.orderId} because it is ${plan.priority.toLowerCase()}. Keep the remaining ${plan.shortfall} units pending and trigger replenishment.`,
        confidence: 0.94,
        severity: plan.priority === "Critical" ? "critical" : "high",
        action: { type: "allocate", orderId: plan.orderId, productId: plan.productId, quantity: plan.allocate },
      });
    } else if (plan.shortfall > 0 && plan.allocate === 0) {
      insights.push({
        id: `replenish-${plan.orderId}-${plan.productId}`,
        kind: "replenishment",
        title: `Zero availability — ${plan.productName}`,
        finding: `${plan.productName} has no free stock; ${plan.orderId} cannot be allocated.`,
        reason: "Reserved stock equals or exceeds on-hand quantity, so no unit can be committed.",
        recommendation: `Raise an urgent replenishment PO for ${plan.productName} and notify ${plan.orderId}'s customer of a revised ETA.`,
        confidence: 0.88,
        severity: "high",
      });
    } else if (plan.allocate > 0) {
      insights.push({
        id: `alloc-${plan.orderId}-${plan.productId}`,
        kind: "allocation",
        title: `Ready to allocate — ${plan.orderId}`,
        finding: `${plan.allocate} × ${plan.productName} can be committed immediately.`,
        reason: `Free stock covers the full outstanding quantity and ${plan.orderId} is ${plan.priority.toLowerCase()} priority.`,
        recommendation: `Allocate ${plan.allocate} units to ${plan.orderId} and release it to picking.`,
        confidence: 0.91,
        severity: plan.priority === "Critical" || plan.priority === "Urgent" ? "medium" : "low",
        action: { type: "allocate", orderId: plan.orderId, productId: plan.productId, quantity: plan.allocate },
      });
    }
  }

  const urgentBlocked = orders.filter(
    (o) => o.status === "Blocked" && (o.priority === "Critical" || o.priority === "Urgent"),
  );
  const topBlocked = urgentBlocked[0];
  if (topBlocked) {
    insights.push({
      id: "prioritize-queue",
      kind: "prioritization",
      title: "Re-sequence the fulfilment queue",
      finding: `${urgentBlocked.length} high-priority orders are blocked (${urgentBlocked.map((o) => o.id).join(", ")}).`,
      reason: "Priority weighting places these orders ahead of the current queue order, and their deadlines are today.",
      recommendation: `Move ${topBlocked.id} to the front of the picking queue and defer Low priority orders by one wave.`,
      confidence: 0.86,
      severity: "high",
      action: { type: "advance", orderId: topBlocked.id },
    });
  }

  const bn = detectBottleneck(throughput);
  if (bn) {
    insights.push({
      id: "bottleneck",
      kind: "bottleneck",
      title: `${bn.stage} is currently the warehouse bottleneck`,
      finding: `${bn.stage} is processing ${bn.ordersPerHour} orders/hour versus ${Math.max(...throughput.map((t) => t.ordersPerHour))} orders/hour upstream.`,
      reason: "Downstream capacity is lower than upstream supply, so work-in-progress accumulates at this stage.",
      recommendation: bn.recommendation,
      confidence: 0.9,
      severity: "medium",
      action: { type: "rebalance", from: bn.donorStage, to: bn.stage },
    });
  }

  for (const ex of exceptions.filter((e) => !e.resolved && e.severity !== "low").slice(0, 3)) {
    insights.push({
      id: `exception-${ex.id}`,
      kind: ex.type === "Delayed order" ? "delay" : "exception",
      title: `${ex.type} — ${ex.id}`,
      finding: ex.detail,
      reason: ex.decision,
      recommendation: ex.resolution,
      confidence: 0.83,
      severity: ex.severity === "high" ? "high" : "medium",
      action: { type: "resolveException", exceptionId: ex.id },
    });
  }

  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return insights.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/* ---------------- What-if simulation ---------------- */

export interface SimulationResult {
  productId: string;
  productName: string;
  before: { stock: number; available: number; status: StockStatus; risk: RiskLevel };
  after: { stock: number; available: number; status: StockStatus; risk: RiskLevel };
  delta: number;
  impactedOrders: string[];
  actions: string[];
}

export function simulateStockChange(
  product: Product,
  delta: number,
  orders: Order[],
): SimulationResult {
  const after: Product = { ...product, inStock: Math.max(0, product.inStock + delta) };
  const impacted = orders
    .filter((o) => o.lines.some((l) => l.productId === product.id && l.allocated < l.quantity))
    .map((o) => o.id);

  const actions: string[] = [];
  const afterStatus = stockStatus(after);
  const afterRisk = stockoutRisk(after);
  if (afterRisk === "Severe" || afterStatus === "Out of Stock") {
    actions.push(`Raise emergency replenishment for ${product.name} (min stock ${product.minStock}).`);
    actions.push("Notify customers of impacted orders with a revised ETA.");
  } else if (afterRisk === "High" || afterStatus === "Critical") {
    actions.push(`Trigger replenishment of ${Math.max(product.minStock - available(after), 1)} units.`);
    actions.push("Reserve remaining stock for Critical and Urgent orders only.");
  } else if (afterRisk === "Medium") {
    actions.push(`Schedule a standard replenishment cycle for ${product.name}.`);
  } else {
    actions.push("No action required — stock remains within healthy thresholds.");
  }
  if (impacted.length) {
    actions.push(`Re-run smart allocation for ${impacted.join(", ")} after the change.`);
  }

  return {
    productId: product.id,
    productName: product.name,
    before: { stock: product.inStock, available: available(product), status: stockStatus(product), risk: stockoutRisk(product) },
    after: { stock: after.inStock, available: available(after), status: afterStatus, risk: afterRisk },
    delta,
    impactedOrders: impacted,
    actions,
  };
}

/* ---------------- Global search ---------------- */

export interface SearchHit {
  kind: "product" | "order" | "location";
  productId?: string;
  orderId?: string;
  title: string;
  subtitle: string;
}

export function searchWarehouse(query: string, products: Product[], orders: Order[]): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const p of products) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ) {
      hits.push({
        kind: "product",
        productId: p.id,
        title: p.name,
        subtitle: `${p.id} · ${p.sku} · ${p.location} · ${available(p)} available`,
      });
    } else if (p.location.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q)) {
      hits.push({
        kind: "location",
        productId: p.id,
        title: `${p.location} — ${p.zone}`,
        subtitle: `${p.name} · ${available(p)} available`,
      });
    }
  }

  for (const o of orders) {
    if (o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)) {
      hits.push({
        kind: "order",
        orderId: o.id,
        title: `${o.id} — ${o.customer}`,
        subtitle: `${o.priority} · ${o.stage} · ${orderQuantity(o)} units · due ${o.deadline}`,
      });
    }
  }

  return hits;
}

export function pendingOrdersForProduct(productId: string, orders: Order[]) {
  return orders.filter(
    (o) => o.status !== "Dispatched" && o.lines.some((l) => l.productId === productId),
  );
}

export function nextStage(stage: Stage): Stage {
  const i = stageIndex(stage);
  return WORKFLOW_STAGES[Math.min(WORKFLOW_STAGES.length - 1, i + 1)] ?? stage;
}
