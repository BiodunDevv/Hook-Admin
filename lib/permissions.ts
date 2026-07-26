import type { AdminUser } from "./api";

/**
 * All granular permission keys used across the admin dashboard.
 * Permissions are resolved from active backend Role records.
 * Only the explicit SUPER_ADMIN role key bypasses individual checks.
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
  "catalog.submission.view",
  "catalog.submission.review",
  "catalog.submission.request_changes",
  "catalog.submission.approve",
  "catalog.submission.reject",
  "catalog.product.view",
  "catalog.product.edit",
  "catalog.product.publish",
  "catalog.product.pause",
  "catalog.product.unpublish",
  "catalog.pricing.view_internal",
  "catalog.pricing.edit",
  "catalog.negotiation_rules.view_internal",
  "catalog.negotiation_rules.edit",
  "catalog.media.upload",
  "catalog.media.review",
  "customers.view",
  "customers.edit",
  "runners.view",
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
  "catalog.submission.view": "View Catalog Submissions",
  "catalog.submission.review": "Review Catalog Submissions",
  "catalog.submission.request_changes": "Request Catalog Changes",
  "catalog.submission.approve": "Approve Catalog Submissions",
  "catalog.submission.reject": "Reject Catalog Submissions",
  "catalog.product.view": "View Commercial Catalog",
  "catalog.product.edit": "Edit Commercial Products",
  "catalog.product.publish": "Publish Commercial Products",
  "catalog.product.pause": "Pause Commercial Products",
  "catalog.product.unpublish": "Unpublish Commercial Products",
  "catalog.pricing.view_internal": "View Internal Pricing",
  "catalog.pricing.edit": "Edit Catalog Pricing",
  "catalog.negotiation_rules.view_internal": "View Negotiation Rules",
  "catalog.negotiation_rules.edit": "Edit Negotiation Rules",
  "catalog.media.upload": "Upload Catalog Media",
  "catalog.media.review": "Review Catalog Media",
  "customers.view": "View Customers",
  "customers.edit": "Edit Customers",
  "runners.view": "View Runners",
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
    label: "Catalog",
    permissions: [
      "products.view", "products.review", "products.edit",
      "catalog.submission.view", "catalog.submission.review", "catalog.submission.request_changes",
      "catalog.submission.approve", "catalog.submission.reject", "catalog.product.view",
      "catalog.product.edit", "catalog.product.publish", "catalog.product.pause",
      "catalog.product.unpublish", "catalog.pricing.view_internal", "catalog.pricing.edit",
      "catalog.negotiation_rules.view_internal", "catalog.negotiation_rules.edit",
      "catalog.media.upload", "catalog.media.review",
    ],
  },
  {
    label: "Customers",
    permissions: ["customers.view", "customers.edit"],
  },
  {
    label: "Operations",
    permissions: ["runners.view", "runners.manage"],
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
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function isSuperAdmin(user: AdminUser | null | undefined): boolean {
  return user?.role === "super_admin" || Boolean(user?.roleKeys?.includes("SUPER_ADMIN"));
}

export function isAdmin(user: AdminUser | null | undefined): boolean {
  return user?.accountType === "staff";
}
