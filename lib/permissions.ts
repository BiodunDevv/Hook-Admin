import type { AdminUser } from "./api";

/**
 * All granular permission keys used across the admin dashboard.
 * Super admins always have all permissions regardless of this list.
 * Admins default to all permissions.
 * Support staff only get what is explicitly assigned.
 */
export const ALL_PERMISSIONS = [
  "staff.view", "staff.create", "staff.edit", "staff.suspend", "staff.revoke_sessions",
  "roles.view", "roles.manage",
  "states.view", "states.manage",
  "cities.view", "cities.manage",
  "zones.view", "zones.manage",
  "markets.view", "markets.manage", "markets.assign_hub",
  "hubs.view", "hubs.manage", "hubs.assign_markets",
  "partners.view", "partners.manage",
  "runners.manage", "runners.assign",
  "audit.view", "settings.manage",
  "orders.view",
  "orders.edit",
  "orders.create",
  "products.view",
  "products.review",
  "products.edit",
  "customers.view",
  "customers.edit",
  "runners.view",
  "runners.edit",
  "financials.view",
  "financials.refund",
  "financials.reconcile",
  "refunds.view",
  "refunds.manage",
  "deletions.view",
  "deletions.manage",
  "analytics.checkout",
  "reports.view",
  "ai_negotiation.view",
  "settings.view",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "staff.view": "View Staff", "staff.create": "Create Staff", "staff.edit": "Edit Staff",
  "staff.suspend": "Suspend Staff", "staff.revoke_sessions": "Revoke Staff Sessions",
  "roles.view": "View Roles", "roles.manage": "Manage Roles",
  "states.view": "View States", "states.manage": "Manage States",
  "cities.view": "View Cities", "cities.manage": "Manage Cities",
  "zones.view": "View Zones", "zones.manage": "Manage Zones",
  "markets.view": "View Markets", "markets.manage": "Manage Markets", "markets.assign_hub": "Assign Market Hubs",
  "hubs.view": "View Hubs", "hubs.manage": "Manage Hubs", "hubs.assign_markets": "Assign Hub Markets",
  "partners.view": "View Partners", "partners.manage": "Manage Partners",
  "runners.manage": "Manage Runners", "runners.assign": "Assign Runners",
  "audit.view": "View Audit Logs", "settings.manage": "Manage Settings",
  "orders.view": "View Orders",
  "orders.edit": "Edit Orders",
  "orders.create": "Create Orders",
  "products.view": "View Products",
  "products.review": "Review Products",
  "products.edit": "Edit Products",
  "customers.view": "View Customers",
  "customers.edit": "Edit Customers",
  "runners.view": "View Runners",
  "runners.edit": "Manage Runners",
  "financials.view": "View Financials",
  "financials.refund": "Issue Refunds",
  "financials.reconcile": "Reconcile Payments",
  "refunds.view": "View Refunds",
  "refunds.manage": "Manage Refunds",
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
    label: "Customers",
    permissions: ["customers.view", "customers.edit"],
  },
  {
    label: "Operations",
    permissions: ["runners.view", "runners.edit"],
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
  if (user.roleKeys?.includes("SUPER_ADMIN")) return true;
  if (user.role === "super_admin") return true;
  if (user.role === "admin") return true;
  // support role — check explicit permissions
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function isSuperAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === "super_admin" || Boolean(user?.roleKeys?.includes("SUPER_ADMIN"));
}

export function isAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}
