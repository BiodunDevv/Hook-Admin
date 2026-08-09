"use client";

import { useAdminSession } from "@/lib/query";
import { hasPermission, isSuperAdmin, isAdmin, type Permission } from "@/lib/permissions";

/**
 * Returns whether the current user has a given permission.
 * Permissions come from the backend's live Role evaluation.
 */
export function usePermission(permission: Permission): boolean {
  const { data: session } = useAdminSession();
  return hasPermission(session, permission);
}

export function useIsSuperAdmin(): boolean {
  const { data: session } = useAdminSession();
  return isSuperAdmin(session);
}

export function useIsAdmin(): boolean {
  const { data: session } = useAdminSession();
  return isAdmin(session);
}

export function useCurrentRole(): string | undefined {
  const { data: session } = useAdminSession();
  return session?.role;
}
