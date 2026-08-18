/**
 * Centralized warehouse dataset.
 * Structured so products / orders / exceptions can be added easily,
 * and so it can later be swapped for a Supabase-backed source.
 */

export type StockStatus = "Healthy" | "Low Stock" | "Critical" | "Out of Stock";
export type Priority = "Critical" | "Urgent" | "Normal" | "Low";

export const WORKFLOW_STAGES = [
  "Order Created",
  "Priority Determined",
  "Inventory Checked",
  "Stock Allocated",
  "Picking",
  "Packing",
  "Quality Check",
  "Dispatch",
] as const;

export type Stage = (typeof WORKFLOW_STAGES)[number];

export type OrderStatus = "Open" | "In Process" | "Blocked" | "Dispatched" | "Partially Allocated";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  zone: string;
  inStock: number;
  reserved: number;
  minStock: number;
}

export interface OrderLine {
  productId: string;
  quantity: number;
  allocated: number;
}

export interface Order {
  id: string;
  customer: string;
  priority: Priority;
  lines: OrderLine[];
  deadline: string;
  stage: Stage;
  status: OrderStatus;
  createdAt: string;
}

export type ExceptionType =
  | "Damaged item"
  | "Missing item"
  | "Stock shortage"
  | "Delayed order"
  | "Picking error"
  | "Packing error";

export interface WarehouseException {
  id: string;
  type: ExceptionType;
  orderId?: string;
  productId?: string;
  detail: string;
  decision: string;
  resolution: string;
  severity: "high" | "medium" | "low";
  resolved: boolean;
  raisedAt: string;
}

export interface StageThroughput {
  stage: string;
  ordersPerHour: number;
  workers: number;
}

export const products: Product[] = [
  { id: "P-1001", name: "Mechanical Keyboard", sku: "KB-MECH-87", category: "Peripherals", location: "A-12-03", zone: "Zone A", inStock: 12, reserved: 5, minStock: 15 },
  { id: "P-1002", name: "Wireless Mouse", sku: "MS-WL-22", category: "Peripherals", location: "A-12-05", zone: "Zone A", inStock: 148, reserved: 24, minStock: 60 },
  { id: "P-1003", name: '27" 4K Monitor', sku: "MON-27-4K", category: "Displays", location: "B-04-01", zone: "Zone B", inStock: 34, reserved: 12, minStock: 20 },
  { id: "P-1004", name: "USB-C Docking Station", sku: "DK-USBC-9", category: "Accessories", location: "B-07-02", zone: "Zone B", inStock: 8, reserved: 6, minStock: 18 },
  { id: "P-1005", name: "Noise Cancelling Headset", sku: "HS-NC-11", category: "Audio", location: "C-02-04", zone: "Zone C", inStock: 0, reserved: 0, minStock: 12 },
  { id: "P-1006", name: "Laptop Stand Aluminium", sku: "LS-AL-04", category: "Accessories", location: "C-05-01", zone: "Zone C", inStock: 76, reserved: 10, minStock: 25 },
  { id: "P-1007", name: "1080p Webcam", sku: "WC-1080-02", category: "Peripherals", location: "A-15-02", zone: "Zone A", inStock: 21, reserved: 18, minStock: 20 },
  { id: "P-1008", name: "Ergonomic Chair", sku: "CH-ERG-51", category: "Furniture", location: "D-01-01", zone: "Zone D", inStock: 15, reserved: 3, minStock: 8 },
  { id: "P-1009", name: "Cable Management Kit", sku: "CM-KIT-07", category: "Accessories", location: "C-09-06", zone: "Zone C", inStock: 210, reserved: 30, minStock: 80 },
  { id: "P-1010", name: "Portable SSD 1TB", sku: "SSD-1TB-P", category: "Storage", location: "B-11-03", zone: "Zone B", inStock: 42, reserved: 8, minStock: 30 },
  { id: "P-1011", name: "Standing Desk Frame", sku: "SD-FRM-88", category: "Furniture", location: "D-03-02", zone: "Zone D", inStock: 6, reserved: 4, minStock: 10 },
  { id: "P-1012", name: "Label Printer", sku: "LP-THRM-3", category: "Equipment", location: "E-01-05", zone: "Zone E", inStock: 19, reserved: 2, minStock: 10 },
];

export const orders: Order[] = [
  { id: "ORD-1024", customer: "Nova Retail Group", priority: "Urgent", lines: [{ productId: "P-1001", quantity: 10, allocated: 0 }], deadline: "Today 18:00", stage: "Inventory Checked", status: "Blocked", createdAt: "Today 09:12" },
  { id: "ORD-1025", customer: "Helix Systems", priority: "Critical", lines: [{ productId: "P-1004", quantity: 6, allocated: 0 }, { productId: "P-1002", quantity: 6, allocated: 6 }], deadline: "Today 16:30", stage: "Stock Allocated", status: "In Process", createdAt: "Today 08:40" },
  { id: "ORD-1026", customer: "Bluepeak Studios", priority: "Normal", lines: [{ productId: "P-1003", quantity: 4, allocated: 4 }], deadline: "Tomorrow 12:00", stage: "Picking", status: "In Process", createdAt: "Today 07:55" },
  { id: "ORD-1027", customer: "Orbit Labs", priority: "Low", lines: [{ productId: "P-1009", quantity: 30, allocated: 30 }], deadline: "Fri 17:00", stage: "Packing", status: "In Process", createdAt: "Yesterday 16:20" },
  { id: "ORD-1028", customer: "Kestrel Media", priority: "Urgent", lines: [{ productId: "P-1007", quantity: 12, allocated: 12 }], deadline: "Today 20:00", stage: "Quality Check", status: "In Process", createdAt: "Today 06:30" },
  { id: "ORD-1029", customer: "Atlas Freight", priority: "Normal", lines: [{ productId: "P-1010", quantity: 8, allocated: 8 }], deadline: "Tomorrow 09:00", stage: "Dispatch", status: "In Process", createdAt: "Yesterday 14:05" },
  { id: "ORD-1030", customer: "Vertex Interiors", priority: "Critical", lines: [{ productId: "P-1011", quantity: 8, allocated: 0 }], deadline: "Today 21:00", stage: "Inventory Checked", status: "Blocked", createdAt: "Today 10:02" },
  { id: "ORD-1031", customer: "Lumen Offices", priority: "Normal", lines: [{ productId: "P-1005", quantity: 5, allocated: 0 }], deadline: "Tomorrow 15:00", stage: "Priority Determined", status: "Open", createdAt: "Today 10:41" },
  { id: "ORD-1032", customer: "Northwind Co", priority: "Low", lines: [{ productId: "P-1006", quantity: 15, allocated: 15 }], deadline: "Mon 11:00", stage: "Order Created", status: "Open", createdAt: "Today 11:15" },
  { id: "ORD-1033", customer: "Solstice Tech", priority: "Urgent", lines: [{ productId: "P-1001", quantity: 4, allocated: 0 }, { productId: "P-1012", quantity: 2, allocated: 2 }], deadline: "Today 19:00", stage: "Inventory Checked", status: "Partially Allocated", createdAt: "Today 11:48" },
  { id: "ORD-1034", customer: "Pinegrove Ltd", priority: "Normal", lines: [{ productId: "P-1008", quantity: 3, allocated: 3 }], deadline: "Tomorrow 10:00", stage: "Picking", status: "In Process", createdAt: "Today 12:10" },
  { id: "ORD-1035", customer: "Cobalt Ventures", priority: "Low", lines: [{ productId: "P-1002", quantity: 20, allocated: 20 }], deadline: "Fri 13:00", stage: "Packing", status: "In Process", createdAt: "Today 12:35" },
];

export const exceptions: WarehouseException[] = [
  { id: "EX-401", type: "Damaged item", productId: "P-1001", orderId: "ORD-1033", detail: "1 keyboard found with damaged casing during picking.", decision: "Check replacement stock in Zone A", resolution: "Replacement available — reallocate replacement unit", severity: "medium", resolved: false, raisedAt: "Today 11:20" },
  { id: "EX-402", type: "Stock shortage", productId: "P-1001", orderId: "ORD-1024", detail: "Order requires 10 keyboards, only 7 available.", decision: "Partial allocation to urgent order + replenishment", resolution: "Allocate 7 units, backorder 3 units", severity: "high", resolved: false, raisedAt: "Today 09:20" },
  { id: "EX-403", type: "Delayed order", orderId: "ORD-1028", detail: "Quality check queue exceeded 45 minutes.", decision: "Re-sequence QC queue by deadline", resolution: "Escalate to QC lead, expedite urgent orders", severity: "medium", resolved: false, raisedAt: "Today 10:55" },
  { id: "EX-404", type: "Packing error", orderId: "ORD-1027", detail: "Wrong carton size selected for 30-unit cable kit.", decision: "Repack with correct carton spec", resolution: "Repack and re-weigh before dispatch", severity: "low", resolved: false, raisedAt: "Today 08:15" },
  { id: "EX-405", type: "Missing item", productId: "P-1004", detail: "2 docking stations missing from bin B-07-02.", decision: "Trigger cycle count for bin B-07-02", resolution: "Adjust stock after count, notify inventory control", severity: "high", resolved: false, raisedAt: "Today 07:30" },
  { id: "EX-406", type: "Picking error", orderId: "ORD-1026", detail: "Picker scanned MON-27-4K from wrong bin.", decision: "Verify scan trail and correct bin mapping", resolution: "Corrected pick, bin map updated", severity: "low", resolved: true, raisedAt: "Yesterday 17:40" },
];

export const throughput: StageThroughput[] = [
  { stage: "Picking", ordersPerHour: 120, workers: 6 },
  { stage: "Packing", ordersPerHour: 60, workers: 3 },
  { stage: "Quality Check", ordersPerHour: 95, workers: 2 },
  { stage: "Dispatch", ordersPerHour: 100, workers: 4 },
];

export const fulfillmentTrend = [
  { day: "Mon", fulfilled: 182, target: 200, stockouts: 3 },
  { day: "Tue", fulfilled: 196, target: 200, stockouts: 2 },
  { day: "Wed", fulfilled: 174, target: 200, stockouts: 5 },
  { day: "Thu", fulfilled: 205, target: 200, stockouts: 1 },
  { day: "Fri", fulfilled: 218, target: 210, stockouts: 2 },
  { day: "Sat", fulfilled: 164, target: 180, stockouts: 4 },
  { day: "Sun", fulfilled: 141, target: 150, stockouts: 1 },
];

export const exceptionTrend = [
  { day: "Mon", damaged: 3, missing: 1, shortage: 4, delays: 2 },
  { day: "Tue", damaged: 2, missing: 2, shortage: 3, delays: 1 },
  { day: "Wed", damaged: 4, missing: 1, shortage: 6, delays: 4 },
  { day: "Thu", damaged: 1, missing: 0, shortage: 2, delays: 2 },
  { day: "Fri", damaged: 2, missing: 3, shortage: 3, delays: 3 },
  { day: "Sat", damaged: 1, missing: 1, shortage: 1, delays: 1 },
  { day: "Sun", damaged: 0, missing: 1, shortage: 2, delays: 0 },
];

export const initialWarehouseState = () => ({
  products: products.map((p) => ({ ...p })),
  orders: orders.map((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l })) })),
  exceptions: exceptions.map((e) => ({ ...e })),
  throughput: throughput.map((t) => ({ ...t })),
});
