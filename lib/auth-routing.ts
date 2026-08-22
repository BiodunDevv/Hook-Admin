import type { AdminUser } from "@/lib/api";

export type WorkspaceType = "staff" | "marketassociate" | "partner";

const legacyStaffRoles = new Set(["support", "admin", "super_admin"]);

export function workspaceType(
  user?: Pick<AdminUser, "accountType" | "role"> | null,
): WorkspaceType | null {
  if (!user) return null;
  if (user.accountType === "staff") return "staff";
  if (user.accountType === "marketassociate") return "marketassociate";
  if (user.accountType === "partner") return "partner";
  return legacyStaffRoles.has(user.role) ? "staff" : null;
}

export function isStaffUser(
  user?: Pick<AdminUser, "accountType" | "role"> | null,
) {
  return workspaceType(user) === "staff";
}

export function dashboardPath(
  user?: Pick<AdminUser, "accountType" | "role"> | null,
) {
  const workspace = workspaceType(user);
  if (workspace === "staff") return "/dashboard";
  if (workspace === "marketassociate") return "/market-associate/dashboard";
  if (workspace === "partner") return "/partner/dashboard";
  return "/auth/login";
}

export function safeDashboardDestination(
  user: Pick<AdminUser, "accountType" | "role">,
  requestedPath?: string | null,
) {
  const workspace = workspaceType(user);
  const fallback = dashboardPath(user);
  const base =
    workspace === "staff"
      ? "/dashboard"
      : workspace === "marketassociate"
        ? "/market-associate"
        : workspace === "partner"
          ? "/partner"
          : null;

  if (
    base &&
    requestedPath &&
    (requestedPath === base || requestedPath.startsWith(`${base}/`))
  ) {
    return requestedPath;
  }
  return fallback;
}
