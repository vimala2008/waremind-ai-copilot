import {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Sparkles,
  PackageCheck,
  Truck,
  TriangleAlert,
  BarChart3,
  FlaskConical,
  Bot,
} from "lucide-react";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/allocation", label: "Smart Allocation", icon: Sparkles },
  { to: "/picking", label: "Picking & Packing", icon: PackageCheck },
  { to: "/dispatch", label: "Dispatch", icon: Truck },
  { to: "/exceptions", label: "Exceptions", icon: TriangleAlert },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/simulator", label: "What-If Simulator", icon: FlaskConical },
  { to: "/copilot", label: "AI Copilot", icon: Bot },
] as const;
