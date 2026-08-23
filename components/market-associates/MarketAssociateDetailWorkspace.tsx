"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Mail,
  MapPin,
  MapPinned,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ShieldX,
  Store,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid, type DefinitionItem } from "@/components/shared/DefinitionGrid";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RelatedMultiSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { apiPatch, apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAdminSession, useApiQuery } from "@/lib/query";
import type { MarketAssociateAction, MarketAssociateAssignment, MarketAssociateMember } from "./market-associate-types";

type MarketOption = {
  id: string;
  publicId: string;
  name: string;
  stateId?: { publicId?: string; _id?: string } | string;
  hub?: { publicId?: string; name?: string } | null;
};

type Values = Record<string, string | string[]>;

type AuditEvent = {
  publicId?: string;
  action: string;
  actorPublicId?: string;
  actorName?: string | null;
  reason?: string;
  createdAt?: string;
  after?: Record<string, unknown>;
};

type AuditResponse = { data: AuditEvent[] };

const actionCopy: Record<MarketAssociateAction, { label: string; title: string; description: string; destructive?: boolean }> = {
  suspend: { label: "Suspend account", title: "Suspend this Market Associate account?", description: "Access will be blocked immediately and active sessions will be revoked.", destructive: true },
  reactivate: { label: "Reactivate account", title: "Reactivate this Market Associate account?", description: "The account will be allowed to sign in again within its assigned Markets and states." },
  restore: { label: "Restore account", title: "Restore this account?", description: "The account will return to active status." },
  archive: { label: "Archive account", title: "Archive this account?", description: "The account will be disabled." },
  "revoke-sessions": { label: "Revoke sessions", title: "Revoke all active sessions?", description: "Every active device will need to authenticate again." },
  "cancel-invitation": { label: "Cancel invitation", title: "Cancel this Market Associate invitation?", description: "The activation link will stop working and the invited account will be disabled.", destructive: true },
};

const stateField: DirectoryField = { key: "stateIds", label: "Operation states", type: "multi-select", optionsEndpoint: "/admin/states" };

function cleanError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function dateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function fullName(member?: MarketAssociateMember) {
  if (!member) return "Market Associate account";
  const account = member.account;
  return [member.firstName || account?.firstName, member.lastName || account?.lastName].filter(Boolean).join(" ") || member.email || account?.email || "Market Associate account";
}

function initials(name: string) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase() || "M";
}

function humanize(value?: string) {
  return String(value || "Not set").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relationPills(relations: MarketAssociateMember["states"] | undefined, empty = "No states assigned") {
  if (!relations?.length) return <span className="text-sm text-muted-foreground">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {relations.map((relation) => (
        <span key={relation.id || relation.publicId || relation.name} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
          <MapPin className="size-3 text-muted-foreground" />
          {relation.name || relation.code || relation.publicId || relation.id || "Unnamed"}
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

export function MarketAssociateDetailWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: admin } = useAdminSession();
  const [editOpen, setEditOpen] = useState(false);
  const [action, setAction] = useState<MarketAssociateAction | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [editStateIds, setEditStateIds] = useState<string[]>([]);
  const [assignmentDialog, setAssignmentDialog] = useState<{ mode: "create" | "reassign"; assignment?: MarketAssociateAssignment } | null>(null);
  const [assignmentStateId, setAssignmentStateId] = useState("");
  const [assignmentMarketId, setAssignmentMarketId] = useState("");
  const [assignmentPriority, setAssignmentPriority] = useState("100");
  const [assignmentIsPrimary, setAssignmentIsPrimary] = useState(false);
  const [assignmentReason, setAssignmentReason] = useState("");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const query = useApiQuery<MarketAssociateMember>(["admin", "market-associates", params.id], `/admin/market-associates/${params.id}`, Boolean(params.id));
  const member = query.data;
  const status = String(member?.status || "unknown").toLowerCase();
  const availability = String(member?.availability || "unavailable").toLowerCase();
  const name = fullName(member);
  const canViewAudit = hasPermission(admin, "audit.view");
  const auditPath = member?.publicId
    ? `/admin/audit-logs?entityType=marketassociate&entityPublicId=${encodeURIComponent(member.publicId)}&limit=8`
    : "/admin/audit-logs?limit=8";
  const auditQuery = useApiQuery<AuditResponse>(["admin", "market-associates", params.id, "audit"], auditPath, Boolean(member?.publicId && canViewAudit));
  const account = member?.account;
  const canEdit = hasPermission(admin, "runners.manage");
  const canInvite = hasPermission(admin, "runners.manage");
  const lifecycleAction: MarketAssociateAction | null = canEdit && (status === "active" || status === "suspended") ? (status === "active" ? "suspend" : "reactivate") : null;
  const auditEvents = auditQuery.data?.data || [];
  const assignments = member?.assignments || [];
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active");
  const canAssign = hasPermission(admin, "runners.assign");
  const marketsQuery = useApiQuery<{ data: MarketOption[] } | MarketOption[]>(
    ["admin", "markets", "for-assignment"],
    "/admin/markets?limit=200",
    Boolean(assignmentDialog),
  );
  const eligibleStates = useMemo(
    () => (member?.states || []).filter((state) => !state.status || state.status === "active"),
    [member?.states],
  );
  const eligibleMarkets = useMemo(() => {
    const rows = Array.isArray(marketsQuery.data) ? marketsQuery.data : marketsQuery.data?.data || [];
    const stateIds = new Set(member?.stateIds || []);
    return rows.filter((market) => {
      const stateId = typeof market.stateId === "string" ? market.stateId : market.stateId?.publicId || market.stateId?._id;
      return stateId ? stateIds.has(stateId) : false;
    });
  }, [marketsQuery.data, member?.stateIds]);
  const marketsForSelectedState = useMemo(
    () =>
      eligibleMarkets.filter((market) => {
        if (!assignmentStateId) return false;
        const stateId = typeof market.stateId === "string" ? market.stateId : market.stateId?.publicId || market.stateId?._id;
        return stateId === assignmentStateId;
      }),
    [eligibleMarkets, assignmentStateId],
  );
  const selectedMarket = useMemo(
    () => eligibleMarkets.find((market) => (market.publicId || market.id) === assignmentMarketId),
    [eligibleMarkets, assignmentMarketId],
  );

  function beginEdit() {
    setValues({
      firstName: String(member?.firstName || account?.firstName || ""),
      lastName: String(member?.lastName || account?.lastName || ""),
      phone: String(member?.phone || account?.phone || ""),
      reason: "",
    });
    setEditStateIds(member?.stateIds?.map(String) || []);
    setEditOpen(true);
  }

  function setValue(key: string, value: string | string[]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auditReason = String(values.reason || "").trim();
    if (!editStateIds.length) return toast.error("Select at least one operation state");
    if (auditReason.length < 3) return toast.error("Add a reason for this profile change");
    setSaving(true);
    try {
      await apiPatch(`/admin/market-associates/${params.id}`, {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        stateIds: editStateIds,
        reason: auditReason,
      });
      toast.success("Market Associate profile updated");
      setEditOpen(false);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to update Market Associate profile"));
    } finally {
      setSaving(false);
    }
  }

  async function runAction() {
    if (!action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      await apiPost(`/admin/market-associates/${params.id}/${action}`, { reason: reason.trim() });
      toast.success(actionCopy[action].label);
      setAction(null);
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to complete Market Associate action"));
    } finally {
      setSaving(false);
    }
  }

  function openAssignmentDialog(mode: "create" | "reassign", assignment?: MarketAssociateAssignment) {
    setAssignmentDialog({ mode, assignment });
    setAssignmentMarketId(assignment?.market?.publicId || assignment?.market?.id || "");
    setAssignmentStateId(eligibleStates.length === 1 ? eligibleStates[0].publicId || "" : "");
    setAssignmentPriority(String(assignment?.priority ?? 100));
    setAssignmentIsPrimary(Boolean(assignment?.isPrimary));
    setAssignmentReason("");
  }

  /**
   * The market list only starts loading once the dialog opens, so the
   * reassign target's state can't be derived synchronously in the opener —
   * once markets arrive, backfill the state picker from whichever market is
   * already selected (reassign) so the cascade starts pre-filled instead of
   * forcing a redundant re-pick of a state the admin already committed to.
   */
  useEffect(() => {
    if (!assignmentDialog || assignmentStateId || !assignmentMarketId) return;
    const rows = Array.isArray(marketsQuery.data) ? marketsQuery.data : marketsQuery.data?.data || [];
    const currentMarket = rows.find((market) => (market.publicId || market.id) === assignmentMarketId);
    const currentStateId = currentMarket
      ? typeof currentMarket.stateId === "string"
        ? currentMarket.stateId
        : currentMarket.stateId?.publicId || currentMarket.stateId?._id
      : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentStateId) setAssignmentStateId(currentStateId);
  }, [assignmentDialog, assignmentStateId, assignmentMarketId, marketsQuery.data]);

  function chooseAssignmentState(stateId: string) {
    setAssignmentStateId(stateId);
    setAssignmentMarketId("");
  }

  function closeAssignmentDialog() {
    if (assignmentSaving) return;
    setAssignmentDialog(null);
  }

  async function submitAssignment() {
    if (!assignmentDialog) return;
    if (!assignmentStateId) return toast.error("Select an operation state");
    if (!assignmentMarketId) return toast.error("Select a Market");
    if (assignmentReason.trim().length < 3) return toast.error("Add a reason for this assignment change");
    setAssignmentSaving(true);
    try {
      const preferredHubId = selectedMarket?.hub?.publicId;
      if (assignmentDialog.mode === "reassign" && assignmentDialog.assignment) {
        await apiPatch(`/admin/market-associate-assignments/${assignmentDialog.assignment.id}`, {
          marketId: assignmentMarketId,
          priority: Number(assignmentPriority) || 100,
          isPrimary: assignmentIsPrimary,
          ...(preferredHubId ? { preferredHubId } : {}),
          assignmentReason: assignmentReason.trim(),
        });
        toast.success("Market assignment updated");
      } else {
        await apiPost("/admin/market-associate-assignments", {
          marketAssociateId: member?.publicId || member?.id,
          marketId: assignmentMarketId,
          priority: Number(assignmentPriority) || 100,
          isPrimary: assignmentIsPrimary,
          ...(preferredHubId ? { preferredHubId } : {}),
          activeFrom: new Date().toISOString(),
          assignmentReason: assignmentReason.trim(),
        });
        toast.success("Market assignment created");
      }
      setAssignmentDialog(null);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to save Market assignment"));
    } finally {
      setAssignmentSaving(false);
    }
  }

  async function resendInvitation() {
    setSaving(true);
    try {
      await apiPost(`/admin/market-associates/${params.id}/resend-invitation`, {});
      toast.success("Invitation sent again");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to resend invitation"));
    } finally {
      setSaving(false);
    }
  }

  const identityItems = definitionItems([
    ["Email", account?.email || member?.email || "Not set"],
    ["Phone", account?.phone || member?.phone || "Not set"],
    ["Account type", "Market Associate"],
    ["Verification", account?.isEmailVerified ? "Email verified" : "Email pending"],
  ]);
  const activityItems = definitionItems([
    ["Created", dateTime(account?.createdAt || member?.createdAt)],
    ["Last updated", dateTime(account?.updatedAt || member?.updatedAt)],
    ["Last sign-in", dateTime(account?.lastLoginAt)],
    ["Lifecycle", <StatusBadge key="lifecycle" status={status} />],
  ]);

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Market Associate profile"
        description="Review identity, operational scope, Market assignments, and audited account actions."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
            {canEdit ? <Button variant="outline" size="sm" onClick={beginEdit} disabled={saving}>Edit profile</Button> : null}
            {lifecycleAction ? <Button variant={lifecycleAction === "suspend" ? "destructive" : "outline"} size="sm" onClick={() => setAction(lifecycleAction)} disabled={saving}>{lifecycleAction === "suspend" ? <Ban /> : <RotateCcw />}{actionCopy[lifecycleAction].label}</Button> : null}
            {status === "invited" && canInvite ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon-sm" aria-label="More Market Associate actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => void resendInvitation()}><Mail /> Resend invitation</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setAction("cancel-invitation")}><ShieldX /> Cancel invitation</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading Market Associate profile" errorTitle="Market Associate profile unavailable" onRetry={() => query.refetch()}>
        {member ? (
          <>
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="bg-zinc-950 px-5 py-6 text-white sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber-400 text-xl font-bold text-zinc-950 shadow-lg shadow-black/20">{initials(name)}</span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{name}</h2>
                      <p className="mt-1 truncate text-sm text-zinc-300">{account?.email || member.email || "No email address"}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300">{member.publicId || member.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={status} className="border-white/15 bg-white/10 text-white" />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-200"><MapPinned className="size-3.5" /> {humanize(availability)}</span>
                  </div>
                </div>
              </div>
              <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                {[
                  ["Operation states", String(member.stateIds?.length || 0)],
                  ["Active Markets", String(activeAssignments.length)],
                  ["Total assignments", String(assignments.length)],
                  ["Last active", account?.lastLoginAt ? dateTime(account.lastLoginAt) : "Never"],
                ].map(([label, value]) => <div key={label} className="min-w-0 px-5 py-4 sm:px-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p></div>)}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.58fr)]">
              <div className="space-y-4">
                <DetailSection title="Operational scope" description="Operation states and Dispatch Hubs evaluated by the backend for sourcing eligibility." action={canEdit ? <Button variant="ghost" size="sm" onClick={beginEdit}>Edit</Button> : null}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Operating states</p>{relationPills(member.states)}</div>
                    <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dispatch Hubs</p>{relationPills(member.hubs, "No Hub restrictions")}</div>
                  </div>
                </DetailSection>

                <DetailSection
                  title="Market assignments"
                  description="Markets this Market Associate sources products from, ranked by priority."
                  action={canAssign ? <Button variant="ghost" size="sm" onClick={() => openAssignmentDialog("create")}><Plus /> Add Market assignment</Button> : null}
                >
                  {assignments.length ? (
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Store className="size-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{assignment.market?.name || "Unknown Market"}{assignment.isPrimary ? <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Primary</span> : null}</p>
                              <p className="text-xs text-muted-foreground">Priority {assignment.priority ?? "—"}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={assignment.status || "pending"} />
                            {canAssign ? <Button variant="outline" size="sm" onClick={() => openAssignmentDialog("reassign", assignment)}>Reassign</Button> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No Markets assigned yet.</p>}
                </DetailSection>

                {canViewAudit ? <DetailSection title="Recent audit activity" description="Append-only actions recorded for this Market Associate account." action={member.publicId ? <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/audit-log?entityPublicId=${encodeURIComponent(member.publicId || "")}`)}>View all</Button> : null}>
                  {auditQuery.isLoading ? <HookLoader size="inline" label="Loading activity" /> : auditQuery.error ? <p className="text-sm text-muted-foreground">Activity could not be loaded. The profile remains available.</p> : auditEvents.length ? <div className="space-y-1">{auditEvents.map((event, index) => <div key={event.publicId || `${event.action}-${event.createdAt}-${index}`} className="flex gap-3 rounded-lg px-2 py-3 even:bg-muted/30"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-foreground">{humanize(event.action)}</p><time className="text-[11px] text-muted-foreground">{dateTime(event.createdAt)}</time></div><p className="mt-1 text-xs text-muted-foreground">{auditSummary(event)}</p>{event.actorName || event.actorPublicId ? <p className="mt-1 text-[11px] text-muted-foreground">By {event.actorName || event.actorPublicId}</p> : null}</div></div>)}</div> : <p className="text-sm text-muted-foreground">No audited activity has been recorded yet.</p>}
                </DetailSection> : null}
              </div>

              <div className="space-y-4">
                <DetailSection title="Identity" description="Verified contact and account identity."><DefinitionGrid items={identityItems} columns={1} /></DetailSection>
                <DetailSection title="Account activity" description="Lifecycle and authentication history."><DefinitionGrid items={activityItems} columns={1} /></DetailSection>
                <DetailSection title="Security posture" description="Session and verification controls for this account.">
                  <div className="space-y-3">
                    <SecurityRow icon={account?.isEmailVerified ? CheckCircle2 : ShieldX} label="Email verification" value={account?.isEmailVerified ? "Verified" : "Pending verification"} positive={Boolean(account?.isEmailVerified)} />
                    <SecurityRow icon={status === "active" ? CheckCircle2 : ShieldX} label="Sign-in access" value={status === "active" ? "Enabled" : humanize(status)} positive={status === "active"} />
                    <SecurityRow icon={UserRound} label="Session control" value="Suspending revokes all active sessions" positive />
                  </div>
                </DetailSection>
              </div>
            </div>
          </>
        ) : null}
      </QueryState>

      <AdminWorkflowSheet
        open={editOpen}
        onOpenChange={(open) => { if (!open && !saving) setEditOpen(false); }}
        title="Edit Market Associate profile"
        description="Update this Market Associate's identity and operational scope."
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="market-associate-edit-form" variant="brand" disabled={saving}>{saving ? <HookLoader size="button" /> : "Save changes"}</Button>
          </>
        )}
      >
        <form id="market-associate-edit-form" onSubmit={saveEdit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["firstName", "lastName"] as const).map((key) => <div key={key} className="space-y-1.5"><Label htmlFor={`ma-${key}`}>{key === "firstName" ? "First name" : "Last name"}</Label><Input id={`ma-${key}`} value={String(values[key] || "")} onChange={(event) => setValue(key, event.target.value)} required /></div>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="ma-email-readonly">Email</Label><Input id="ma-email-readonly" value={String(account?.email || member?.email || "")} type="email" readOnly className="bg-muted/40" /></div>
            <div className="space-y-1.5"><Label htmlFor="ma-phone-edit">Phone number</Label><Input id="ma-phone-edit" value={String(values.phone || "")} onChange={(event) => setValue("phone", event.target.value)} type="tel" required /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ma-edit-states">Operation states</Label>
            <RelatedMultiSelect field={stateField} value={editStateIds} values={{}} onChange={setEditStateIds} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="ma-edit-reason">Audit reason</Label><Textarea id="ma-edit-reason" value={String(values.reason || "")} onChange={(event) => setValue("reason", event.target.value)} placeholder="Why is this profile change needed?" maxLength={500} required /></div>
        </form>
      </AdminWorkflowSheet>

      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !saving) { setAction(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{action ? actionCopy[action].title : "Confirm Market Associate action"}</DialogTitle><DialogDescription>{action ? actionCopy[action].description : "This action will be audited."}</DialogDescription></DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="ma-detail-action-reason">Audit reason</Label><Textarea id="ma-detail-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} /></div>
          <DialogFooter><Button variant="outline" onClick={() => { setAction(null); setReason(""); }} disabled={saving}>Cancel</Button><Button variant={action && actionCopy[action].destructive ? "destructive" : "brand"} onClick={() => void runAction()} disabled={saving || reason.trim().length < 3}>{saving ? <HookLoader size="button" /> : action ? actionCopy[action].label : "Confirm action"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignmentDialog)} onOpenChange={(open) => { if (!open) closeAssignmentDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignmentDialog?.mode === "reassign" ? "Reassign Market" : "Add Market assignment"}</DialogTitle>
            <DialogDescription>
              {assignmentDialog?.mode === "reassign"
                ? "Move this assignment to a different Market. Only Markets within this Market Associate's operation states are eligible."
                : "Assign this Market Associate to a Market they will source products from. Only Markets within their operation states are eligible."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-state">Operation state</Label>
              <Select value={assignmentStateId} onValueChange={chooseAssignmentState}>
                <SelectTrigger id="assignment-state" className="w-full">
                  <SelectValue placeholder="Select an operation state" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStates.map((state) => (
                    <SelectItem key={state.publicId || state.id} value={state.publicId || state.id || ""}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!eligibleStates.length ? (
                <p className="text-xs text-muted-foreground">This Market Associate has no active operation states. Add one first.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignment-market">Market</Label>
              <Select value={assignmentMarketId} onValueChange={setAssignmentMarketId} disabled={!assignmentStateId || marketsQuery.isLoading}>
                <SelectTrigger id="assignment-market" className="w-full">
                  <SelectValue placeholder={marketsQuery.isLoading ? "Loading Markets..." : !assignmentStateId ? "Select a state first" : "Select a Market"} />
                </SelectTrigger>
                <SelectContent>
                  {marketsForSelectedState.map((market) => (
                    <SelectItem key={market.publicId || market.id} value={market.publicId || market.id}>{market.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignmentStateId && !marketsQuery.isLoading && !marketsForSelectedState.length ? (
                <p className="text-xs text-muted-foreground">No Markets found in this state.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Dispatch Hub</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                {selectedMarket
                  ? selectedMarket.hub?.name || "No Hub attached to this Market"
                  : "Auto-filled once a Market is selected"}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="assignment-priority">Priority</Label>
                <Input id="assignment-priority" type="number" min={1} value={assignmentPriority} onChange={(event) => setAssignmentPriority(event.target.value)} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <Label htmlFor="assignment-primary">Primary assignment</Label>
                  <p className="text-xs text-muted-foreground">Preferred Market for this state</p>
                </div>
                <Switch id="assignment-primary" checked={assignmentIsPrimary} onCheckedChange={setAssignmentIsPrimary} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignment-reason">Reason</Label>
              <Textarea id="assignment-reason" value={assignmentReason} onChange={(event) => setAssignmentReason(event.target.value)} placeholder="Add a clear operational reason" maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssignmentDialog} disabled={assignmentSaving}>Cancel</Button>
            <Button variant="brand" onClick={() => void submitAssignment()} disabled={assignmentSaving || !assignmentStateId || !assignmentMarketId || assignmentReason.trim().length < 3}>
              {assignmentSaving ? <HookLoader size="button" /> : assignmentDialog?.mode === "reassign" ? "Save reassignment" : "Create assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityRow({ icon: Icon, label, value, positive }: { icon: typeof CheckCircle2; label: string; value: string; positive: boolean }) {
  return <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"><span className={`grid size-8 place-items-center rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p></div></div>;
}
