"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { StaffAccessFields } from "./StaffAccessFields";
import type { StaffRole } from "./staff-types";

type Values = Record<string, string | string[]>;
type RoleResponse = StaffRole & { _id?: string };
type RolesResponse = RoleResponse[];

export function StaffCreateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => Promise<unknown> | unknown }) {
  const rolesQuery = useApiQuery<RolesResponse>(["admin", "roles", "staff-create"], "/admin/roles", open);
  const roles = (rolesQuery.data || [])
    .filter((role) => role.isActive !== false)
    .map((role) => {
      const id = role.id || role._id;
      return id ? { ...role, id: String(id) } : null;
    })
    .filter((role): role is StaffRole => Boolean(role));
  const [values, setValues] = useState<Values>({ scopeType: "global", roleIds: [], stateIds: [], hubIds: [] });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleSelectionTouched, setRoleSelectionTouched] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const preferredRole = roles.find((role) => role.key === "CUSTOMER_SUPPORT_OFFICER") || roles.find((role) => role.key !== "SUPER_ADMIN") || roles[0];
  const preferredRoleId = preferredRole?.id;
  const selectedRoleIds = useMemo(
    () => roleSelectionTouched ? selectedRoles : (preferredRoleId ? [preferredRoleId] : []),
    [preferredRoleId, roleSelectionTouched, selectedRoles],
  );

  function setValue(key: string, value: string | string[]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function changeScope(scopeType: string) {
    setValues((current) => ({
      ...current,
      scopeType,
      ...(scopeType === "global" || scopeType === "single_state"
        ? { stateIds: [], hubIds: [] }
        : {}),
    }));
  }

  function updateRoles(next: string[]) {
    setRoleSelectionTouched(true);
    setSelectedRoles(next);
    setValues((previous) => ({ ...previous, roleIds: next }));
  }

  function reset() {
    setValues({ scopeType: "global", roleIds: [], stateIds: [], hubIds: [] });
    setSelectedRoles([]);
    setRoleSelectionTouched(false);
    setExpanded(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scopeType = String(values.scopeType || "global");
    const roleIds = selectedRoleIds;
    const stateIds = Array.isArray(values.stateIds) ? values.stateIds : [];
    const hubIds = Array.isArray(values.hubIds) ? values.hubIds : [];
    if (!roleIds.length) return toast.error("Select at least one role");
    if (scopeType === "single_state" && stateIds.length !== 1) return toast.error("Single-state staff must have exactly one state");
    if (scopeType === "multi_state" && stateIds.length < 2) return toast.error("Multi-state staff need at least two states");
    if (scopeType === "hub" && (!stateIds.length || !hubIds.length)) return toast.error("Hub scope requires at least one state and Hub");
    if (scopeType === "global" && (stateIds.length || hubIds.length)) return toast.error("Global staff cannot have state or Hub restrictions");

    setSaving(true);
    try {
      await apiPost("/admin/staff", {
        firstName: String(form.get("firstName") || "").trim(),
        lastName: String(form.get("lastName") || "").trim(),
        email: String(form.get("email") || "").trim().toLowerCase(),
        phone: String(form.get("phone") || "").trim(),
        password: String(form.get("password") || "").trim() || undefined,
        roleIds,
        scopeType,
        stateIds: scopeType === "global" ? [] : stateIds,
        hubIds: scopeType === "hub" ? hubIds : [],
      });
      toast.success("Staff invitation created");
      reset();
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to create staff invitation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGuard permission="staff.create">
      <AdminWorkflowSheet
        open={open}
        onOpenChange={(next) => { if (!next && !saving) { reset(); onClose(); } }}
        title="Add staff member"
        description="Create an invitation with a backend-managed role and operational scope. Access is evaluated live from assigned roles."
        footer={<><Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button><Button type="submit" form="staff-create-form" variant="brand" disabled={saving || rolesQuery.isLoading || !selectedRoleIds.length}>{saving ? <HookLoader size="button" /> : "Create invitation"}</Button></>}
      >
          <form id="staff-create-form" onSubmit={submit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="staff-first-name">First name</Label><Input id="staff-first-name" name="firstName" placeholder="Amina" required /></div>
              <div className="space-y-1.5"><Label htmlFor="staff-last-name">Last name</Label><Input id="staff-last-name" name="lastName" placeholder="Okafor" required /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="staff-email">Work email</Label><Input id="staff-email" name="email" type="email" placeholder="name@hook.africa" required /></div>
              <div className="space-y-1.5"><Label htmlFor="staff-phone">Phone number</Label><Input id="staff-phone" name="phone" type="tel" placeholder="+234 801 234 5678" required /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="staff-password">Temporary password <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="staff-password" name="password" type="password" minLength={9} placeholder="Leave empty to use the invitation setup flow" /><p className="text-xs text-muted-foreground">The invitation remains the source of truth for account activation.</p></div>
            <StaffAccessFields
              roles={roles}
              rolesLoading={rolesQuery.isLoading}
              selectedRoleIds={selectedRoleIds}
              values={values}
              permissionPreviewOpen={expanded}
              onPermissionPreviewOpenChange={setExpanded}
              onRolesChange={updateRoles}
              onScopeChange={changeScope}
              onValueChange={setValue}
            />
          </form>
      </AdminWorkflowSheet>
    </PermissionGuard>
  );
}
