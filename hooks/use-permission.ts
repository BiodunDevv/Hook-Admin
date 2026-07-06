"use client";

import { useAdminSession } from "@/lib/query";
import { hasPermission, isSuperAdmin, isAdmin, type Permission } from "@/lib/permissions";

/**
 * Returns whether the current user has a given permission.
 * Super admins and admins always return true.
 * Support staff only return true if the permission is in their assigned list.
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
