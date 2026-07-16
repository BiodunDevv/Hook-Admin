import {
  LayoutGrid,
  ShoppingCart,
  Package,
  Store,
  Truck,
  UsersRound,
  MapPinned,
  Users,
  Wallet,
  Bot,
  BarChart3,
  Settings,
  LifeBuoy,
  ChartNoAxesCombined,
  RotateCcw,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  dot?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Vendors", href: "/dashboard/vendors", icon: Store },
  { label: "Drivers", href: "/dashboard/drivers", icon: Truck, dot: true },
  { label: "Field Agents", href: "/dashboard/field-agents", icon: UsersRound },
  { label: "Booths", href: "/dashboard/booths", icon: MapPinned },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Financials", href: "/dashboard/financials", icon: Wallet },
  { label: "Refunds", href: "/dashboard/refunds", icon: RotateCcw },
  { label: "Checkout Analytics", href: "/dashboard/checkout-analytics", icon: ChartNoAxesCombined },
  { label: "AI Negotiation", href: "/dashboard/ai-negotiation", icon: Bot },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
