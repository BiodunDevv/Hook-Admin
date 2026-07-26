import {
  LayoutGrid,
  ShoppingCart,
  Package,
  UsersRound,
  Users,
  Wallet,
  Bot,
  BarChart3,
  Settings,
  LifeBuoy,
  ChartNoAxesCombined,
  RotateCcw,
  MapPinned,
  Warehouse,
  Handshake,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  dot?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Control Tower", href: "/dashboard", icon: LayoutGrid },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Commercial Catalog", href: "/dashboard/products", icon: Package },
  { label: "Runner Operations", href: "/dashboard/runners", icon: UsersRound },
  { label: "Markets", href: "/dashboard/markets", icon: MapPinned },
  { label: "Dispatch Hubs", href: "/dashboard/hubs", icon: Warehouse },
  { label: "Hook Partners", href: "/dashboard/partners", icon: Handshake },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Financials", href: "/dashboard/financials", icon: Wallet },
  { label: "Refunds", href: "/dashboard/refunds", icon: RotateCcw },
  { label: "Checkout Analytics", href: "/dashboard/checkout-analytics", icon: ChartNoAxesCombined },
  { label: "AI Negotiation", href: "/dashboard/ai-negotiation", icon: Bot },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Administration", href: "/dashboard/administration", icon: ShieldCheck },
];
