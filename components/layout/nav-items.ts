import {
  BadgeCheck,
  BarChart3,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  Handshake,
  LayoutGrid,
  LifeBuoy,
  MapPinned,
  Package,
  RotateCcw,
  Settings,
  ScrollText,
  KeyRound,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { AdminUser } from "@/lib/api";
import {
  hasPermission,
  isSuperAdmin,
  type Permission,
} from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: Permission;
  superAdminOnly?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Control Tower", href: "/dashboard", icon: LayoutGrid }],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Orders",
        href: "/dashboard/orders",
        icon: ShoppingCart,
        permission: "orders.view",
      },
      {
        label: "POD Verification",
        href: "/dashboard/orders/pod",
        icon: BadgeCheck,
        permission: "commerce.pod.review",
      },
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: CreditCard,
        permission: "commerce.payments.view",
      },
      {
        label: "Checkout Analytics",
        href: "/dashboard/checkout-analytics",
        icon: ChartNoAxesCombined,
        permission: "analytics.checkout",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Catalog Review",
        href: "/dashboard/catalog-review",
        icon: ClipboardCheck,
        permission: "catalog.submission.view",
      },
      {
        label: "Commercial Catalog",
        href: "/dashboard/commercial",
        icon: Package,
        permission: "catalog.product.view",
      },
      {
        label: "Product Inventory",
        href: "/dashboard/products",
        icon: Boxes,
        permission: "products.view",
      },
      {
        label: "Categories",
        href: "/dashboard/categories",
        icon: Tags,
        permission: "categories.view",
      },
      {
        label: "AI Negotiation",
        href: "/dashboard/ai-negotiation",
        icon: Bot,
        permission: "ai_negotiation.view",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Fulfilment",
        href: "/dashboard/fulfilment",
        icon: Truck,
        permission: "fulfilment.view",
      },
      {
        label: "Market Associate Operations",
        href: "/dashboard/market-associates",
        icon: UsersRound,
        permission: "runners.view",
      },
      {
        label: "Markets",
        href: "/dashboard/markets",
        icon: MapPinned,
        permission: "markets.view",
      },
      {
        label: "Dispatch Hubs",
        href: "/dashboard/hubs",
        icon: Warehouse,
        permission: "hubs.view",
      },
      {
        label: "Hook Partners",
        href: "/dashboard/partners",
        icon: Handshake,
        permission: "partners.view",
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        label: "Customers",
        href: "/dashboard/customers",
        icon: Users,
        permission: "customers.view",
      },
      {
        label: "Support",
        href: "/dashboard/support",
        icon: LifeBuoy,
        permission: "deletions.view",
      },
    ],
  },
  {
    label: "Finance & Insights",
    items: [
      {
        label: "Financials",
        href: "/dashboard/financials",
        icon: Wallet,
        permission: "financials.view",
      },
      {
        label: "Refunds",
        href: "/dashboard/fulfilment/refunds",
        icon: RotateCcw,
        permission: "finance.refunds.view",
      },
      {
        label: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        permission: "reports.view",
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        label: "Staff",
        href: "/dashboard/staff",
        icon: UserCog,
        permission: "staff.view",
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        permission: "settings.view",
      },
      {
        label: "Operating States",
        href: "/dashboard/operating-states",
        icon: MapPinned,
        permission: "states.view",
      },
      {
        label: "Delivery States & Fees",
        href: "/dashboard/delivery-states",
        icon: Truck,
        permission: "delivery.coverage.view",
      },
      {
        label: "Roles & Permissions",
        href: "/dashboard/roles",
        icon: KeyRound,
        permission: "roles.view",
      },
      {
        label: "Audit Log",
        href: "/dashboard/audit-log",
        icon: ScrollText,
        permission: "audit.view",
      },
    ],
  },
];

export const navItems = navGroups.flatMap((group) => group.items);

export function canAccessNavItem(
  item: NavItem,
  user: AdminUser | null | undefined,
) {
  if (item.superAdminOnly) return isSuperAdmin(user);
  if (!item.permission) return Boolean(user);
  return hasPermission(user, item.permission);
}

export function findNavItem(pathname: string) {
  return [...navItems]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
}
