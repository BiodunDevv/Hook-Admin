"use client";

import { Check, ChevronDown, ChevronUp, Headset, MapPin, Shield, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RelatedMultiSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { useApiQuery } from "@/lib/query";
import type { StaffRole } from "./staff-types";

export type StaffAccessValues = Record<string, string | string[]>;

const scopeOptions = [
  { value: "global", label: "Global", description: "All permitted operations" },
  { value: "multi_state", label: "Multiple states", description: "Two or more operating states" },
  { value: "single_state", label: "Single state", description: "One operating state" },
  { value: "hub", label: "Dispatch Hub", description: "State and Hub restricted" },
];

const locationFields: DirectoryField[] = [
  { key: "hubIds", label: "Dispatch hubs", type: "multi-select", optionsEndpoint: "/admin/hubs", dependsOn: "stateIds", dependsOnKey: "stateId" },
];

type StateOption = { id?: string; publicId?: string; name?: string; capitalName?: string; status?: string };
type StateResponse = StateOption[] | { data?: StateOption[] };

function roleIcon(key: string) {
  if (key.includes("SUPER")) return ShieldCheck;
  if (key.includes("SUPPORT")) return Headset;
  return Shield;
}

function roleLabel(role: StaffRole) {
  return role.name || role.key.replaceAll("_", " ");
}

export function StaffAccessFields({
  roles,
  rolesLoading,
  selectedRoleIds,
  values,
  permissionPreviewOpen,
  onPermissionPreviewOpenChange,
  onRolesChange,
  onScopeChange,
  onValueChange,
}: {
  roles: StaffRole[];
  rolesLoading: boolean;
  selectedRoleIds: string[];
  values: StaffAccessValues;
  permissionPreviewOpen: boolean;
  onPermissionPreviewOpenChange: (open: boolean) => void;
  onRolesChange: (roleIds: string[]) => void;
  onScopeChange: (scopeType: string) => void;
  onValueChange: (key: string, value: string | string[]) => void;
}) {
  const statesQuery = useApiQuery<StateResponse>(["admin", "states", "staff-scope"], "/admin/states?limit=100");
  const stateRows = Array.isArray(statesQuery.data) ? statesQuery.data : statesQuery.data?.data || [];
  const states = stateRows.flatMap((state) => {
    const id = state.id || state.publicId;
    return id ? [{ ...state, id: String(id), name: state.name || String(id) }] : [];
  });
  const selectedStateIds = Array.isArray(values.stateIds) ? values.stateIds : [];
  const allStatesSelected = states.length > 0 && states.every((state) => selectedStateIds.includes(state.id));
  const effectivePermissions = [...new Set(
    roles
      .filter((role) => selectedRoleIds.includes(role.id))
      .flatMap((role) => role.permissionKeys || []),
  )];

  function toggleRole(roleId: string) {
    onRolesChange(
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((value) => value !== roleId)
        : [...selectedRoleIds, roleId],
    );
  }

  function setStates(stateIds: string[]) {
    onValueChange("stateIds", stateIds);
    onValueChange("hubIds", []);
  }

  function toggleState(stateId: string) {
    if (values.scopeType === "single_state") {
      setStates(selectedStateIds.includes(stateId) ? [] : [stateId]);
      return;
    }
    setStates(selectedStateIds.includes(stateId)
      ? selectedStateIds.filter((value) => value !== stateId)
      : [...selectedStateIds, stateId]);
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Access roles</Label>
          <span className="text-xs text-muted-foreground">{selectedRoleIds.length} selected</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => {
            const Icon = roleIcon(role.key);
            const selected = selectedRoleIds.includes(role.id);

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${selected ? "border-zinc-900 bg-zinc-950 text-white" : "border-border bg-card hover:border-zinc-400"}`}
              >
                <span className={`mt-0.5 grid size-7 place-items-center rounded-md ${selected ? "bg-amber-400 text-zinc-950" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{roleLabel(role)}</span>
                  <span className={`mt-0.5 block text-xs ${selected ? "text-zinc-300" : "text-muted-foreground"}`}>
                    {role.description || "Backend-managed operational access"}
                  </span>
                </span>
                {selected ? <Check className="mt-1 size-4 text-amber-400" /> : null}
              </button>
            );
          })}
        </div>
        {rolesLoading ? <p className="text-xs text-muted-foreground">Loading available roles...</p> : null}
        {!rolesLoading && !roles.length ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No active roles are available for assignment.</p> : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Operational scope</Label>
          <span className="text-xs text-muted-foreground">Validated by the backend</span>
        </div>
        <Select value={String(values.scopeType || "global")} onValueChange={onScopeChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {scopeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label} · {option.description}</SelectItem>)}
          </SelectContent>
        </Select>
        {values.scopeType === "single_state" ? <p className="text-xs text-muted-foreground">Choose one new operating state below. Previous state and Hub selections were cleared.</p> : null}
      </div>

      {values.scopeType !== "global" ? (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Operating States</p>
                <p className="text-xs text-muted-foreground">{selectedStateIds.length} of {states.length} selected</p>
              </div>
              {values.scopeType !== "single_state" ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor="staff-all-states" className="text-xs">All States</Label>
                  <Switch
                    id="staff-all-states"
                    checked={allStatesSelected}
                    onCheckedChange={(checked) => setStates(checked ? states.map((state) => state.id) : [])}
                    disabled={statesQuery.isLoading || !states.length}
                  />
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {states.map((state) => {
                const selected = selectedStateIds.includes(state.id);
                const active = state.status !== "inactive";
                return (
                  <div key={state.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${selected ? "border-amber-400 bg-amber-50/70" : "bg-background"}`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-md ${selected ? "bg-amber-400 text-zinc-950" : "bg-muted text-muted-foreground"}`}><MapPin className="size-4" /></span>
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{state.name}</span>{state.capitalName ? <span className="block truncate text-[11px] text-muted-foreground">Capital: {state.capitalName}</span> : null}</span>
                    </div>
                    <Switch checked={selected} onCheckedChange={() => toggleState(state.id)} disabled={!active} aria-label={`Toggle ${state.name}`} />
                  </div>
                );
              })}
            </div>
            {statesQuery.isLoading ? <p className="px-4 pb-3 text-xs text-muted-foreground">Loading Operating States...</p> : null}
            {!statesQuery.isLoading && !states.length ? <p className="px-4 pb-3 text-xs text-muted-foreground">No Operating States are available.</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
          {locationFields.filter(() => values.scopeType === "hub").map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>
              <RelatedMultiSelect
                field={field}
                value={Array.isArray(values[field.key]) ? values[field.key] as string[] : []}
                values={values}
                onChange={(next) => onValueChange(field.key, next)}
              />
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          Global scope grants access across all operating states. State and Hub restrictions are intentionally cleared.
        </div>
      )}

      <div className="rounded-lg border bg-muted/20">
        <button
          type="button"
          className="flex w-full items-center justify-between p-3 text-left"
          onClick={() => onPermissionPreviewOpenChange(!permissionPreviewOpen)}
        >
          <span>
            <span className="block text-sm font-medium">Effective permission preview</span>
            <span className="block text-xs text-muted-foreground">Inherited from the selected role{selectedRoleIds.length === 1 ? "" : "s"}; individual permission overrides are not accepted.</span>
          </span>
          {permissionPreviewOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {permissionPreviewOpen ? (
          <div className="flex flex-wrap gap-1.5 border-t p-3">
            {effectivePermissions.map((permission) => <span key={permission} className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground">{PERMISSION_LABELS[permission as Permission] || permission}</span>)}
            {!effectivePermissions.length ? <span className="text-xs text-muted-foreground">Select a role to preview permissions.</span> : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
