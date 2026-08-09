"use client";

import { usePermission, useIsSuperAdmin } from "@/hooks/use-permission";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has the required permission.
 * Visibility follows the backend's live Role evaluation.
 * Falls back to nothing (or a custom fallback) when access is denied.
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const allowed = usePermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders children only if the current user is a super_admin.
 */
export function SuperAdminGuard({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isSuperAdmin = useIsSuperAdmin();
  return isSuperAdmin ? <>{children}</> : <>{fallback}</>;
}
