"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Headset, Shield, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { RelatedMultiSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import type { StaffRole } from "./staff-types";

type Values = Record<string, string | string[]>;
type RoleResponse = StaffRole & { _id?: string };
type RolesResponse = RoleResponse[];

const scopeOptions = [
  { value: "global", label: "Global", description: "All permitted operations" },
  { value: "multi_state", label: "Multiple states", description: "Two or more operating states" },
  { value: "single_state", label: "Single state", description: "One operating state" },
  { value: "hub", label: "Dispatch Hub", description: "State and Hub restricted" },
];

const locationFields: DirectoryField[] = [
  { key: "stateIds", label: "Operation states", type: "multi-select", optionsEndpoint: "/admin/states" },
  { key: "hubIds", label: "Dispatch hubs", type: "multi-select", optionsEndpoint: "/admin/hubs", dependsOn: "stateIds", dependsOnKey: "stateId" },
];

function roleIcon(key: string) {
  if (key.includes("SUPER")) return ShieldCheck;
  if (key.includes("SUPPORT")) return Headset;
  return Shield;
}

function roleLabel(role: StaffRole) {
  return role.name || role.key.replaceAll("_", " ");
}

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

  const effectivePermissions = useMemo(() => {
    const selected = roles.filter((role) => selectedRoleIds.includes(role.id));
    return [...new Set(selected.flatMap((role) => role.permissionKeys || []))];
  }, [roles, selectedRoleIds]);

  function setValue(key: string, value: string | string[]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(id: string) {
    setRoleSelectionTouched(true);
    const next = selectedRoleIds.includes(id) ? selectedRoleIds.filter((value) => value !== id) : [...selectedRoleIds, id];
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
      <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) { reset(); onClose(); } }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700"><UserPlus className="size-4" /></span> Add staff member</DialogTitle><DialogDescription>Create an invitation with a backend-managed role and operational scope. Access is evaluated live from assigned roles.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="staff-first-name">First name</Label><Input id="staff-first-name" name="firstName" placeholder="Amina" required /></div>
              <div className="space-y-1.5"><Label htmlFor="staff-last-name">Last name</Label><Input id="staff-last-name" name="lastName" placeholder="Okafor" required /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="staff-email">Work email</Label><Input id="staff-email" name="email" type="email" placeholder="name@hook.africa" required /></div>
              <div className="space-y-1.5"><Label htmlFor="staff-phone">Phone number</Label><Input id="staff-phone" name="phone" type="tel" placeholder="+234 801 234 5678" required /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="staff-password">Temporary password <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="staff-password" name="password" type="password" minLength={9} placeholder="Leave empty to use the invitation setup flow" /><p className="text-xs text-muted-foreground">The invitation remains the source of truth for account activation.</p></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Access roles</Label><span className="text-xs text-muted-foreground">{selectedRoleIds.length} selected</span></div><div className="grid gap-2 sm:grid-cols-2">{roles.map((role) => { const Icon = roleIcon(role.key); const selected = selectedRoleIds.includes(role.id); return <button key={role.id} type="button" onClick={() => toggleRole(role.id)} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${selected ? "border-zinc-900 bg-zinc-950 text-white" : "border-border bg-card hover:border-zinc-400"}`}><span className={`mt-0.5 grid size-7 place-items-center rounded-md ${selected ? "bg-amber-400 text-zinc-950" : "bg-muted text-muted-foreground"}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{roleLabel(role)}</span><span className={`mt-0.5 block text-xs ${selected ? "text-zinc-300" : "text-muted-foreground"}`}>{role.description || "Backend-managed operational access"}</span></span>{selected ? <Check className="mt-1 size-4 text-amber-400" /> : null}</button>; })}</div>{rolesQuery.isLoading ? <p className="text-xs text-muted-foreground">Loading available roles...</p> : null}{!rolesQuery.isLoading && !roles.length ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No active roles are available for assignment.</p> : null}</div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Operational scope</Label><span className="text-xs text-muted-foreground">Validated by the backend</span></div><Select value={String(values.scopeType || "global")} onValueChange={(scopeType) => { setValue("scopeType", scopeType); if (scopeType === "global") { setValue("stateIds", []); setValue("hubIds", []); } }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{scopeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label} · {option.description}</SelectItem>)}</SelectContent></Select></div>
            {values.scopeType !== "global" ? <div className="grid gap-3 sm:grid-cols-2">{locationFields.map((field) => <div key={field.key} className="space-y-1.5"><Label>{field.label}</Label><RelatedMultiSelect field={field} value={Array.isArray(values[field.key]) ? values[field.key] as string[] : []} values={values} onChange={(next) => setValue(field.key, next)} /></div>)}</div> : <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">Global scope grants access across all operating states. State and Hub restrictions are intentionally cleared.</div>}
            <div className="rounded-lg border bg-muted/20"><button type="button" className="flex w-full items-center justify-between p-3 text-left" onClick={() => setExpanded((current) => !current)}><span><span className="block text-sm font-medium">Effective permission preview</span><span className="block text-xs text-muted-foreground">Inherited from the selected role{selectedRoleIds.length === 1 ? "" : "s"}; individual permission overrides are not accepted.</span></span>{expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}</button>{expanded ? <div className="flex flex-wrap gap-1.5 border-t p-3">{effectivePermissions.map((permission) => <span key={permission} className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground">{PERMISSION_LABELS[permission as Permission] || permission}</span>)}{!effectivePermissions.length ? <span className="text-xs text-muted-foreground">Select a role to preview permissions.</span> : null}</div> : null}</div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button><Button type="submit" variant="brand" disabled={saving || rolesQuery.isLoading || !selectedRoleIds.length}>{saving ? <HookLoader size="button" /> : "Create invitation"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
