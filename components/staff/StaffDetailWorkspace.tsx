"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Ban,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid, type DefinitionItem } from "@/components/shared/DefinitionGrid";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiPatch, apiPost } from "@/lib/api";
import { hasPermission, PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { StaffAccessFields } from "./StaffAccessFields";
import type { StaffRole } from "./staff-types";

type Values = Record<string, string | string[]>;

type Relation = {
  id?: string;
  publicId?: string;
  name?: string;
  code?: string;
  status?: string;
};

type StaffDetail = {
  id: string;
  publicId?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  scopeType?: string;
  roleIds?: string[];
  stateIds?: string[];
  hubIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  roles?: StaffRole[];
  permissions?: string[];
  states?: Relation[];
  hubs?: Relation[];
  account?: {
    id?: string;
    publicId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    accountType?: string;
    accountStatus?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    lastLoginAt?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

type AuditEvent = {
  publicId?: string;
  action: string;
  actorPublicId?: string;
  reason?: string;
  createdAt?: string;
  after?: Record<string, unknown>;
};

type AuditResponse = { data: AuditEvent[] };
type RoleOption = {
  _id?: string;
  id?: string;
  publicId?: string;
  key?: string;
  name?: string;
  description?: string;
  permissionKeys?: string[];
  isActive?: boolean;
};
type RoleOptionsResponse = RoleOption[] | { data?: RoleOption[] };

type StaffAction = "suspend" | "reactivate" | "restore" | "archive" | "revoke-sessions" | "cancel-invitation";

const actionCopy: Record<StaffAction, { label: string; title: string; description: string; destructive?: boolean }> = {
  suspend: { label: "Suspend account", title: "Suspend this staff account?", description: "Access will be blocked immediately and active sessions will be revoked.", destructive: true },
  reactivate: { label: "Reactivate account", title: "Reactivate this staff account?", description: "The account will be allowed to sign in again within its assigned scope." },
  restore: { label: "Restore account", title: "Restore this archived staff account?", description: "The account will return to active status with its assigned roles and operational scope." },
  archive: { label: "Archive account", title: "Archive this staff account?", description: "The account will be disabled and retained for audit history.", destructive: true },
  "revoke-sessions": { label: "Revoke sessions", title: "Revoke all active sessions?", description: "Every active device will need to authenticate again." },
  "cancel-invitation": { label: "Cancel invitation", title: "Cancel this staff invitation?", description: "The activation link will stop working and the invited account will be disabled.", destructive: true },
};

function cleanError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function dateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function fullName(staff?: StaffDetail) {
  if (!staff) return "Staff account";
  const account = staff.account;
  return [staff.firstName || account?.firstName, staff.lastName || account?.lastName].filter(Boolean).join(" ") || staff.email || account?.email || "Staff account";
}

function initials(name: string) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase() || "S";
}

function humanize(value?: string) {
  return String(value || "Not set").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relationLabel(relation: Relation) {
  return relation.name || relation.code || relation.publicId || relation.id || "Unnamed";
}

function relationPills(relations: Relation[] | undefined, empty = "No restrictions") {
  if (!relations?.length) return <span className="text-sm text-muted-foreground">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {relations.map((relation) => (
        <span key={relation.id || relation.publicId || `${relation.name}-${relation.code}`} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
          <MapPin className="size-3 text-muted-foreground" />
          {relationLabel(relation)}
          {relation.status ? <StatusBadge status={relation.status} className="ml-0.5" /> : null}
        </span>
      ))}
    </div>
  );
}

function definitionItems(items: Array<[string, ReactNode]>): DefinitionItem[] {
  return items.map(([label, value]) => ({ label, value }));
}

function auditSummary(event: AuditEvent) {
  const status = event.after?.status;
  if (typeof status === "string") return `Status changed to ${humanize(status)}`;
  return event.reason || "Administrative change recorded";
}

export function StaffDetailWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: admin } = useAdminSession();
  const [editOpen, setEditOpen] = useState(false);
  const [action, setAction] = useState<StaffAction | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [values, setValues] = useState<Values>({});
  const query = useApiQuery<StaffDetail>(["admin", "staff", params.id], `/admin/staff/${params.id}`, Boolean(params.id));
  const roleOptionsQuery = useApiQuery<RoleOptionsResponse>(["admin", "roles", "staff-edit"], "/admin/roles?limit=100", editOpen);
  const staff = query.data;
  const status = String(staff?.status || "unknown").toLowerCase();
  const name = fullName(staff);
  const canViewAudit = hasPermission(admin, "audit.view");
  const auditPath = staff?.publicId
    ? `/admin/audit-logs?entityType=staff&entityPublicId=${encodeURIComponent(staff.publicId)}&limit=8`
    : "/admin/audit-logs?limit=8";
  const auditQuery = useApiQuery<AuditResponse>(["admin", "staff", params.id, "audit"], auditPath, Boolean(staff?.publicId && canViewAudit));
  const account = staff?.account;
  const adminIdentifiers = [admin?.id, admin?.publicId].filter(Boolean);
  const staffIdentifiers = [staff?.id, staff?.publicId, account?.id, account?.publicId].filter(Boolean);
  const isSelf = Boolean(adminIdentifiers.some((identifier) => staffIdentifiers.includes(identifier)));
  const isProtected = Boolean(staff?.roles?.some((role) => role.key === "SUPER_ADMIN"));
  const canEdit = hasPermission(admin, "staff.edit");
  const canSuspend = hasPermission(admin, "staff.suspend") && !isSelf && !isProtected;
  const canRevokeSessions = hasPermission(admin, "staff.revoke_sessions") && !isSelf;
  const canInvite = hasPermission(admin, "staff.create");
  const scope = humanize(staff?.scopeType);
  const roleNames = staff?.roles?.map((role) => role.name || humanize(role.key)) || [];
  const permissions = useMemo(
    () => staff?.permissions || [...new Set(staff?.roles?.flatMap((role) => role.permissionKeys || []) || [])],
    [staff?.permissions, staff?.roles],
  );
  const permissionGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    permissions.forEach((permission) => {
      const domain = humanize(permission.split(".")[0]);
      const entries = groups.get(domain) || [];
      entries.push(permission);
      groups.set(domain, entries);
    });
    return [...groups.entries()];
  }, [permissions]);
  const lifecycleAction: StaffAction | null = canSuspend && status === "active" ? "suspend" : canSuspend && status === "suspended" ? "reactivate" : canSuspend && status === "disabled" ? "restore" : null;
  const auditEvents = auditQuery.data?.data || [];
  const roleOptions = useMemo<StaffRole[]>(
    () => {
      const options = Array.isArray(roleOptionsQuery.data) ? roleOptionsQuery.data : roleOptionsQuery.data?.data || [];
      return options
        .filter((role) => role.isActive !== false)
        .flatMap((role) => {
          const id = role.id || role._id || role.publicId;
          if (!id) return [];
          const key = role.key || String(id);
          return [{
            id: String(id),
            key,
            name: role.name || humanize(key),
            description: role.description,
            permissionKeys: role.permissionKeys,
            isActive: role.isActive,
          }];
        });
    },
    [roleOptionsQuery.data],
  );
  const selectedRoleIds = useMemo(
    () => Array.isArray(values.roleIds) ? values.roleIds : [],
    [values.roleIds],
  );

  function beginEdit() {
    setValues({
      firstName: String(staff?.firstName || account?.firstName || ""),
      lastName: String(staff?.lastName || account?.lastName || ""),
      phone: String(staff?.phone || account?.phone || ""),
      scopeType: String(staff?.scopeType || "global"),
      roleIds: staff?.roleIds?.map(String) || staff?.roles?.map((role) => role.id) || [],
      stateIds: staff?.stateIds?.map(String) || [],
      hubIds: staff?.hubIds?.map(String) || [],
      reason: "",
    });
    setPermissionsExpanded(false);
    setEditOpen(true);
  }

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

  function validateScope() {
    const scopeType = String(values.scopeType || "global");
    const stateIds = Array.isArray(values.stateIds) ? values.stateIds : [];
    const hubIds = Array.isArray(values.hubIds) ? values.hubIds : [];
    const roleIds = Array.isArray(values.roleIds) ? values.roleIds : [];
    if (!roleIds.length) return "Assign at least one role";
    if (scopeType === "single_state" && stateIds.length !== 1) return "Single-state staff must have exactly one state";
    if (scopeType === "multi_state" && stateIds.length < 2) return "Multi-state staff need at least two states";
    if (scopeType === "hub" && (!stateIds.length || !hubIds.length)) return "Hub scope requires a state and Dispatch Hub";
    if (scopeType === "global" && (stateIds.length || hubIds.length)) return "Global staff cannot have state or Hub restrictions";
    return null;
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scopeError = validateScope();
    const auditReason = String(values.reason || "").trim();
    if (scopeError) return toast.error(scopeError);
    if (auditReason.length < 3) return toast.error("Add a reason for this access change");
    setSaving(true);
    try {
      const scopeType = String(values.scopeType || "global");
      const editableValues: Values = {
        ...values,
        stateIds: scopeType === "global" ? [] : Array.isArray(values.stateIds) ? values.stateIds : [],
        hubIds: scopeType === "hub" && Array.isArray(values.hubIds) ? values.hubIds : [],
      };
      delete editableValues.email;
      await apiPatch(`/admin/staff/${params.id}`, { ...editableValues, reason: auditReason });
      toast.success("Staff account updated");
      setEditOpen(false);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to update staff account"));
    } finally {
      setSaving(false);
    }
  }

  async function runAction() {
    if (!action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await apiPost(`/admin/staff/${params.id}/${action}`, { reason: reason.trim() });
      toast.success(actionCopy[action].label);
      setAction(null);
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to complete staff action"));
    } finally {
      setSaving(false);
    }
  }

  async function resendInvitation() {
    setSaving(true);
    try {
      await apiPost(`/admin/staff/${params.id}/resend-invitation`, {});
      toast.success("Invitation sent again");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to resend invitation"));
    } finally {
      setSaving(false);
    }
  }

  const identityItems = definitionItems([
    ["Email", account?.email || staff?.email || "Not set"],
    ["Phone", account?.phone || staff?.phone || "Not set"],
    ["Account type", humanize(account?.accountType || "staff")],
    ["Verification", account?.isEmailVerified ? "Email verified" : "Email pending"],
  ]);
  const activityItems = definitionItems([
    ["Created", dateTime(account?.createdAt || staff?.createdAt)],
    ["Last updated", dateTime(account?.updatedAt || staff?.updatedAt)],
    ["Last sign-in", dateTime(account?.lastLoginAt)],
    ["Lifecycle", <StatusBadge key="lifecycle" status={status} />],
  ]);

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Staff profile"
        description="Review identity, access boundaries, security activity, and audited account actions."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back</Button>
            {canEdit ? <Button variant="outline" size="sm" onClick={beginEdit} disabled={saving}><ShieldCheck /> Edit access</Button> : null}
            {lifecycleAction ? <Button variant={lifecycleAction === "suspend" ? "destructive" : "outline"} size="sm" onClick={() => setAction(lifecycleAction)} disabled={saving}>{lifecycleAction === "suspend" ? <Ban /> : <RotateCcw />}{actionCopy[lifecycleAction].label}</Button> : null}
            {(status === "invited" && canInvite) || (status !== "disabled" && (canRevokeSessions || canSuspend)) ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon-sm" aria-label="More staff actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {status === "invited" && canInvite ? <DropdownMenuItem onSelect={() => void resendInvitation()}><Mail /> Resend invitation</DropdownMenuItem> : null}
                  {status === "invited" && canSuspend ? <DropdownMenuItem variant="destructive" onSelect={() => setAction("cancel-invitation")}><ShieldX /> Cancel invitation</DropdownMenuItem> : null}
                  {status !== "invited" && status !== "disabled" && canRevokeSessions ? <DropdownMenuItem onSelect={() => setAction("revoke-sessions")}><KeyRound /> Revoke sessions</DropdownMenuItem> : null}
                  {status !== "invited" && status !== "disabled" && canSuspend ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => setAction("archive")}><Archive /> Archive account</DropdownMenuItem></> : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading staff profile" errorTitle="Staff profile unavailable" onRetry={() => query.refetch()}>
        {staff ? (
          <>
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="bg-zinc-950 px-5 py-6 text-white sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber-400 text-xl font-bold text-zinc-950 shadow-lg shadow-black/20">{initials(name)}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{name}</h2>
                        {isSelf ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-200">You</span> : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-300">{account?.email || staff.email || "No email address"}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300">{staff.publicId || staff.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={status} className="border-white/15 bg-white/10 text-white" />
                    {isProtected ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200"><ShieldCheck className="size-3.5" /> Protected role</span> : null}
                  </div>
                </div>
              </div>
              <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                {[
                  ["Scope", scope],
                  ["Roles", String(staff.roles?.length || 0)],
                  ["Permissions", String(permissions.length)],
                  ["Last active", account?.lastLoginAt ? dateTime(account.lastLoginAt) : "Never"],
                ].map(([label, value]) => <div key={label} className="min-w-0 px-5 py-4 sm:px-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p></div>)}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.58fr)]">
              <div className="space-y-4">
                <DetailSection title="Access and operational scope" description="The roles and geography boundaries evaluated by the backend for every request." action={canEdit ? <Button variant="ghost" size="sm" onClick={beginEdit}><ShieldCheck /> Edit</Button> : null}>
                  <DefinitionGrid items={definitionItems([["Scope model", scope], ["Assigned roles", roleNames.length ? roleNames.join(" · ") : "No roles assigned"]])} />
                  <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operating states</p>{relationPills(staff.states, staff.stateIds?.length ? staff.stateIds.join(" · ") : "Global scope")}</div>
                    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispatch Hubs</p>{relationPills(staff.hubs)}</div>
                  </div>
                </DetailSection>

                <DetailSection title="Effective permissions" description="Inherited from the assigned roles. Individual permission overrides are not used.">
                  {permissionGroups.length ? <div className="space-y-4">{permissionGroups.map(([group, groupPermissions]) => <div key={group}><p className="mb-2 text-xs font-semibold text-foreground">{group}</p><div className="flex flex-wrap gap-2">{groupPermissions.map((permission) => <span key={permission} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{PERMISSION_LABELS[permission as Permission] || humanize(permission)}</span>)}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No active permissions are currently assigned.</p>}
                </DetailSection>

                {canViewAudit ? <DetailSection title="Recent audit activity" description="Append-only actions recorded for this staff account." action={staff.publicId ? <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/administration/audit-logs?entityPublicId=${encodeURIComponent(staff.publicId || "")}`)}>View all</Button> : null}>
                  {auditQuery.isLoading ? <HookLoader size="inline" label="Loading activity" /> : auditQuery.error ? <p className="text-sm text-muted-foreground">Activity could not be loaded. The staff profile remains available.</p> : auditEvents.length ? <div className="space-y-1">{auditEvents.map((event, index) => <div key={event.publicId || `${event.action}-${event.createdAt}-${index}`} className="flex gap-3 rounded-lg px-2 py-3 even:bg-muted/30"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-foreground">{humanize(event.action)}</p><time className="text-[11px] text-muted-foreground">{dateTime(event.createdAt)}</time></div><p className="mt-1 text-xs text-muted-foreground">{auditSummary(event)}</p>{event.actorPublicId ? <p className="mt-1 text-[11px] text-muted-foreground">Actor {event.actorPublicId}</p> : null}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No audited activity has been recorded yet.</p>}
                </DetailSection> : null}
              </div>

              <div className="space-y-4">
                <DetailSection title="Identity" description="Verified contact and account identity."><DefinitionGrid items={identityItems} columns={1} /></DetailSection>
                <DetailSection title="Account activity" description="Lifecycle and authentication history."><DefinitionGrid items={activityItems} columns={1} /></DetailSection>
                <DetailSection title="Security posture" description="Session and verification controls for this account.">
                  <div className="space-y-3">
                    <SecurityRow icon={account?.isEmailVerified ? CheckCircle2 : ShieldX} label="Email verification" value={account?.isEmailVerified ? "Verified" : "Pending verification"} positive={Boolean(account?.isEmailVerified)} />
                    <SecurityRow icon={status === "active" ? CheckCircle2 : ShieldX} label="Sign-in access" value={status === "active" ? "Enabled" : humanize(status)} positive={status === "active"} />
                    <SecurityRow icon={isSelf ? UserRound : KeyRound} label="Session control" value={isSelf ? "Your own account" : "Administrator revocation available"} positive={!isSelf} />
                  </div>
                </DetailSection>
                {isProtected ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p><span className="font-semibold">Super Admin protection.</span> System access cannot be weakened or archived from this workspace.</p></div></div> : null}
              </div>
            </div>
          </>
        ) : null}
      </QueryState>

      <AdminWorkflowSheet
        open={editOpen}
        onOpenChange={(open) => { if (!open && !saving) setEditOpen(false); }}
        title="Edit staff access"
        description="Update this staff member’s identity, roles, and operational scope. Access is evaluated live from assigned roles."
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="staff-access-form" variant="brand" disabled={saving}>{saving ? <HookLoader size="button" /> : "Save changes"}</Button>
          </>
        )}
      >
          <form id="staff-access-form" onSubmit={saveEdit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["firstName", "lastName"] as const).map((key) => <div key={key} className="space-y-1.5"><Label htmlFor={`staff-${key}`}>{key === "firstName" ? "First name" : "Last name"}</Label><Input id={`staff-${key}`} value={String(values[key] || "")} onChange={(event) => setValue(key, event.target.value)} required /></div>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="staff-email">Work email</Label><Input id="staff-email" value={String(values.email || account?.email || staff?.email || "")} type="email" readOnly className="bg-muted/40" /></div>
              <div className="space-y-1.5"><Label htmlFor="staff-phone">Phone number</Label><Input id="staff-phone" value={String(values.phone || "")} onChange={(event) => setValue("phone", event.target.value)} type="tel" required /></div>
            </div>
            <StaffAccessFields
              roles={roleOptions}
              rolesLoading={roleOptionsQuery.isLoading}
              selectedRoleIds={selectedRoleIds}
              values={values}
              permissionPreviewOpen={permissionsExpanded}
              onPermissionPreviewOpenChange={setPermissionsExpanded}
              onRolesChange={(roleIds) => setValue("roleIds", roleIds)}
              onScopeChange={changeScope}
              onValueChange={setValue}
            />
            <div className="space-y-1.5"><Label htmlFor="staff-edit-reason">Audit reason</Label><Textarea id="staff-edit-reason" value={String(values.reason || "")} onChange={(event) => setValue("reason", event.target.value)} placeholder="Why is this access or profile change needed?" maxLength={500} required /></div>
          </form>
      </AdminWorkflowSheet>

      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !saving) { setAction(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action ? actionCopy[action].title : "Confirm staff action"}</DialogTitle><DialogDescription>{action ? actionCopy[action].description : "This action will be audited."}</DialogDescription></DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="staff-action-reason">Audit reason</Label><Textarea id="staff-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
          <DialogFooter><Button variant="outline" onClick={() => { setAction(null); setReason(""); }} disabled={saving}>Cancel</Button><Button variant={action && actionCopy[action].destructive ? "destructive" : "brand"} onClick={() => void runAction()} disabled={saving || reason.trim().length < 3}>{saving ? <HookLoader size="button" /> : action ? actionCopy[action].label : "Confirm action"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityRow({ icon: Icon, label, value, positive }: { icon: typeof CheckCircle2; label: string; value: string; positive: boolean }) {
  return <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"><span className={`grid size-8 place-items-center rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p></div></div>;
}
