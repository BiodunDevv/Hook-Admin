"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  Ban,
  CheckCircle2,
  KeyRound,
  Trash2,
  Mail,
  MapPin,
  MapPinned,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ShieldX,
  Store,
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
import { MarketAssociateActionDialog } from "./MarketAssociateActionDialog";
import { useIsSuperAdmin } from "@/hooks/use-permission";
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
  delete: { label: "Delete permanently", title: "Delete this account permanently?", description: "The account is removed for good.", destructive: true },
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
  const superAdmin = useIsSuperAdmin();
  const [editOpen, setEditOpen] = useState(false);
  const [action, setAction] = useState<MarketAssociateAction | null>(null);
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
  const [assignmentChange, setAssignmentChange] = useState<{ assignment: MarketAssociateAssignment; action: "pause" | "activate" | "end" } | null>(null);
  const [changeReason, setChangeReason] = useState("");
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
    setAssignmentSaving(true);
    try {
      const preferredHubId = selectedMarket?.hub?.publicId;
      if (assignmentDialog.mode === "reassign" && assignmentDialog.assignment) {
        await apiPatch(`/admin/market-associate-assignments/${assignmentDialog.assignment.id}`, {
          marketId: assignmentMarketId,
          priority: Number(assignmentPriority) || 100,
          isPrimary: assignmentIsPrimary,
          ...(preferredHubId ? { preferredHubId } : {}),
          assignmentReason: assignmentReason.trim() || `Moved from the ${name} profile`,
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
          assignmentReason: assignmentReason.trim() || `Assigned from the ${name} profile`,
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

  async function applyAssignmentChange() {
    if (!assignmentChange || changeReason.trim().length < 3) return;
    setAssignmentSaving(true);
    try {
      await apiPost(`/admin/market-associate-assignments/${assignmentChange.assignment.id}/${assignmentChange.action}`, { reason: changeReason.trim() });
      toast.success(assignmentChange.action === "end" ? "Assignment ended" : assignmentChange.action === "pause" ? "Assignment paused" : "Assignment resumed");
      setAssignmentChange(null);
      setChangeReason("");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to update this assignment"));
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
            {canEdit ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon-sm" aria-label="More Market Associate actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {status === "invited" ? <><DropdownMenuItem onSelect={() => void resendInvitation()}><Mail /> Resend invitation</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => setAction("cancel-invitation")}><ShieldX /> Cancel invitation</DropdownMenuItem></> : null}
                  {status === "active" || status === "suspended" ? <><DropdownMenuItem onSelect={() => setAction("revoke-sessions")}><KeyRound /> Revoke sessions</DropdownMenuItem><DropdownMenuItem variant="destructive" onSelect={() => setAction("archive")}><Archive /> Archive account</DropdownMenuItem></> : null}
                  {status === "disabled" ? <><DropdownMenuItem onSelect={() => setAction("restore")}><RotateCcw /> Restore account</DropdownMenuItem>{superAdmin ? <DropdownMenuItem variant="destructive" onSelect={() => setAction("delete")}><Trash2 /> Delete permanently</DropdownMenuItem> : null}</> : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading Market Associate profile" errorTitle="Market Associate profile unavailable" onRetry={() => query.refetch()}>
        {member ? (
          <>
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-amber-100 text-lg font-semibold text-amber-900">{initials(name)}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold tracking-tight">{name}</h2>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{account?.email || member.email || "No email address"}{account?.phone || member.phone ? ` · ${account?.phone || member.phone}` : ""}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{member.publicId || member.id}</p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium"><MapPinned className="size-3.5" /> {humanize(availability)}</span>
              </div>
              <div className="grid grid-cols-2 divide-x border-t sm:grid-cols-4">
                {[
                  ["Operation states", String(member.stateIds?.length || 0)],
                  ["Active Markets", String(activeAssignments.length)],
                  ["Sign-in", status === "active" ? "Enabled" : humanize(status)],
                  ["Last active", account?.lastLoginAt ? dateTime(account.lastLoginAt) : "Never"],
                ].map(([label, value]) => <div key={label} className="min-w-0 px-5 py-3"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div>)}
              </div>
              {status === "invited" ? <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-amber-50/70 px-5 py-3 text-sm text-amber-900"><span className="flex items-center gap-2"><Mail className="size-4" /> Waiting for them to accept the email invitation.</span>{canInvite ? <Button size="sm" variant="outline" onClick={() => void resendInvitation()} disabled={saving}>Resend invitation</Button> : null}</div> : null}
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
                              <p className="text-xs text-muted-foreground">Priority {assignment.priority ?? "—"}{assignment.market?.hubName ? ` · ${assignment.market.hubName}` : ""}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge status={assignment.status || "pending"} />
                            {canAssign && assignment.status !== "ended" ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Assignment actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onSelect={() => openAssignmentDialog("reassign", assignment)}>Move to another Market</DropdownMenuItem>
                                  {assignment.status === "paused"
                                    ? <DropdownMenuItem onSelect={() => setAssignmentChange({ assignment, action: "activate" })}>Resume</DropdownMenuItem>
                                    : <DropdownMenuItem onSelect={() => setAssignmentChange({ assignment, action: "pause" })}>Pause</DropdownMenuItem>}
                                  <DropdownMenuItem variant="destructive" onSelect={() => setAssignmentChange({ assignment, action: "end" })}>End assignment</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
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
                <DetailSection title="Account" description="Contact details and sign-in history."><DefinitionGrid items={[...identityItems, ...activityItems]} columns={1} /></DetailSection>
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

      <MarketAssociateActionDialog member={member || null} action={action} open={Boolean(action)} onClose={() => setAction(null)} onSuccess={() => { if (action === "delete") router.push("/dashboard/market-associates"); else void query.refetch(); }} />

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
              <Label htmlFor="assignment-reason">Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="assignment-reason" value={assignmentReason} onChange={(event) => setAssignmentReason(event.target.value)} placeholder="Why is this changing?" maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssignmentDialog} disabled={assignmentSaving}>Cancel</Button>
            <Button variant="brand" onClick={() => void submitAssignment()} disabled={assignmentSaving || !assignmentStateId || !assignmentMarketId}>
              {assignmentSaving ? <HookLoader size="button" /> : assignmentDialog?.mode === "reassign" ? "Save reassignment" : "Create assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(assignmentChange)} onOpenChange={(open) => { if (!open && !assignmentSaving) { setAssignmentChange(null); setChangeReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignmentChange?.action === "end" ? "End this assignment?" : assignmentChange?.action === "pause" ? "Pause this assignment?" : "Resume this assignment?"}</DialogTitle>
            <DialogDescription>{assignmentChange?.assignment.market?.name || "This Market"}. {assignmentChange?.action === "end" ? "They are taken off this Market. You can assign them again later." : assignmentChange?.action === "pause" ? "They stop receiving work from this Market until you resume it." : "They receive work from this Market again."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5"><Label htmlFor="assignment-change-reason">Reason</Label><Input id="assignment-change-reason" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Recorded in the audit log" maxLength={500} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignmentChange(null); setChangeReason(""); }} disabled={assignmentSaving}>Cancel</Button>
            <Button variant={assignmentChange?.action === "end" ? "destructive" : "brand"} onClick={() => void applyAssignmentChange()} disabled={assignmentSaving || changeReason.trim().length < 3}>{assignmentSaving ? <HookLoader size="button" /> : assignmentChange?.action === "end" ? "End assignment" : assignmentChange?.action === "pause" ? "Pause" : "Resume"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
