import type { AdminUser } from "./api";

/**
 * All granular permission keys used across the admin dashboard.
 * Super admins always have all permissions regardless of this list.
 * Admins default to all permissions.
 * Support staff only get what is explicitly assigned.
 */
export const ALL_PERMISSIONS = [
  "orders.view",
  "orders.edit",
  "orders.create",
  "products.view",
  "products.review",
  "products.edit",
  "vendors.view",
  "vendors.approve",
  "vendors.edit",
  "customers.view",
  "customers.edit",
  "drivers.view",
  "drivers.edit",
  "field_agents.view",
  "booths.view",
  "booths.edit",
  "financials.view",
  "financials.refund",
  "financials.reconcile",
  "refunds.view",
  "refunds.manage",
  "booths.inventory",
  "deletions.view",
  "deletions.manage",
  "analytics.checkout",
  "reports.view",
  "ai_negotiation.view",
  "settings.view",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "orders.view": "View Orders",
  "orders.edit": "Edit Orders",
  "orders.create": "Create Orders",
  "products.view": "View Products",
  "products.review": "Review Products",
  "products.edit": "Edit Products",
  "vendors.view": "View Vendors",
  "vendors.approve": "Approve Vendors",
  "vendors.edit": "Edit Vendors",
  "customers.view": "View Customers",
  "customers.edit": "Edit Customers",
  "drivers.view": "View Drivers",
  "drivers.edit": "Edit Drivers",
  "field_agents.view": "View Field Agents",
  "booths.view": "View Booths",
  "booths.edit": "Edit Booths",
  "financials.view": "View Financials",
  "financials.refund": "Issue Refunds",
  "financials.reconcile": "Reconcile Payments",
  "refunds.view": "View Refunds",
  "refunds.manage": "Manage Refunds",
  "booths.inventory": "Manage Booth Inventory",
  "deletions.view": "View Deletion Requests",
  "deletions.manage": "Manage Deletion Requests",
  "analytics.checkout": "View Checkout Analytics",
  "reports.view": "View Reports",
  "ai_negotiation.view": "View AI Negotiation",
  "settings.view": "View Settings",
};

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Orders",
    permissions: ["orders.view", "orders.edit", "orders.create"],
  },
  {
    label: "Products",
    permissions: ["products.view", "products.review", "products.edit"],
  },
  {
    label: "Vendors",
    permissions: ["vendors.view", "vendors.approve", "vendors.edit"],
  },
  {
    label: "Customers",
    permissions: ["customers.view", "customers.edit"],
  },
  {
    label: "Operations",
    permissions: ["drivers.view", "drivers.edit", "field_agents.view", "booths.view", "booths.edit", "booths.inventory"],
  },
  {
    label: "Finance & Reports",
    permissions: ["financials.view", "financials.refund", "financials.reconcile", "reports.view", "ai_negotiation.view", "analytics.checkout"],
  },
  {
    label: "Platform",
    permissions: ["refunds.view", "refunds.manage", "deletions.view", "deletions.manage", "settings.view"],
  },
];

export function hasPermission(user: AdminUser | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.role === "admin") return true;
  // support role — check explicit permissions
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function isSuperAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === "super_admin";
}

export function isAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}
