"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Archive,
  Ban,
  BadgeDollarSign,
  KeyRound,
  Mail,
  MoreHorizontal,
  Package,
  Pencil,
  RotateCcw,
  ShoppingBag,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { DefinitionGrid, type DefinitionItem } from "@/components/shared/DefinitionGrid";
import { DetailSection } from "@/components/shared/DetailSection";
import { HookLoader } from "@/components/shared/HookLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiPatch } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { PartnerActionDialog } from "./PartnerActionDialog";
import type { Partner, PartnerAction, PartnerAnalytics } from "./partner-types";

type Period = "today" | "week" | "month" | "allTime";

const periodLabel: Record<Period, string> = { today: "Today", week: "This week", month: "This month", allTime: "All time" };

const naira = (minor?: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(minor || 0) / 100);

function cleanError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function dateTime(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase() || "?";
}

type EditValues = { name: string; firstName: string; lastName: string; phone: string; address: string };

export function PartnerDetailWorkspace() {
  const params = useParams<{ id: string }>();
  const { data: session } = useAdminSession();
  const canView = hasPermission(session, "partners.view");
  const [period, setPeriod] = useState<Period>("month");
  const [action, setAction] = useState<PartnerAction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<EditValues>({ name: "", firstName: "", lastName: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const query = useApiQuery<Partner>(["admin", "partners", params.id], `/admin/partners/${params.id}`, Boolean(session && canView));
  const analyticsQuery = useApiQuery<PartnerAnalytics>(["admin", "partners", params.id, "analytics"], `/admin/partners/${params.id}/analytics`, Boolean(session && canView));
  const statesQuery = useApiQuery<{ id?: string; publicId?: string; name?: string }[] | { data?: { id?: string; publicId?: string; name?: string }[] }>(["admin", "states", "partner-detail"], "/admin/states?limit=100", Boolean(session && canView));
  const citiesQuery = useApiQuery<{ id?: string; publicId?: string; name?: string }[] | { data?: { id?: string; publicId?: string; name?: string }[] }>(["admin", "cities", "partner-detail"], "/admin/cities?limit=200", Boolean(session && canView));
  const marketsQuery = useApiQuery<{ id?: string; publicId?: string; name?: string }[] | { data?: { id?: string; publicId?: string; name?: string }[] }>(["admin", "markets", "partner-detail"], "/admin/markets?limit=200", Boolean(session && canView));

  const partner = query.data;
  const analytics = analyticsQuery.data;
  const stateRows = Array.isArray(statesQuery.data) ? statesQuery.data : statesQuery.data?.data || [];
  const cityRows = Array.isArray(citiesQuery.data) ? citiesQuery.data : citiesQuery.data?.data || [];
  const marketRows = Array.isArray(marketsQuery.data) ? marketsQuery.data : marketsQuery.data?.data || [];
  const stateName = stateRows.find((row) => (row.id || row.publicId) === partner?.stateId)?.name;
  const cityName = cityRows.find((row) => (row.id || row.publicId) === partner?.cityId)?.name;
  const marketName = marketRows.find((row) => (row.id || row.publicId) === partner?.marketId)?.name;

  const status = String(partner?.status || "unknown").toLowerCase();
  const archived = status === "disabled";
  const lifecycleAction: PartnerAction = status === "active" ? "suspend" : "reactivate";
  const name = partner?.name || "Hook Partner location";
  const contactName = [partner?.firstName, partner?.lastName].filter(Boolean).join(" ") || partner?.account?.email || "Not recorded";

  function openEdit() {
    if (!partner) return;
    setEditValues({ name: partner.name || "", firstName: partner.firstName || "", lastName: partner.lastName || "", phone: partner.phone || partner.account?.phone || "", address: partner.address || "" });
    setEditOpen(true);
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editValues.name.trim().length < 2) return toast.error("Add the location's name");
    setSaving(true);
    try {
      await apiPatch(`/admin/partners/${params.id}`, {
        name: editValues.name.trim(),
        firstName: editValues.firstName.trim(),
        lastName: editValues.lastName.trim(),
        phone: editValues.phone.trim(),
        address: editValues.address.trim(),
        reason: "Updated Hook Partner details",
      });
      toast.success("Hook Partner details updated");
      setEditOpen(false);
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Could not save these changes"));
    } finally {
      setSaving(false);
    }
  }

  const contactItems: DefinitionItem[] = [
    { label: "Contact person", value: contactName },
    { label: "Email", value: partner?.account?.email || partner?.email || "Not recorded" },
    { label: "Phone", value: partner?.phone || partner?.account?.phone || "Not recorded" },
    { label: "Account status", value: <StatusBadge status={partner?.account?.accountStatus || status} /> },
    { label: "Email verified", value: partner?.account?.isEmailVerified ? "Yes" : "No" },
    { label: "Last signed in", value: dateTime(partner?.account?.lastLoginAt || partner?.lastLoginAt) },
  ];

  const locationItems: DefinitionItem[] = [
    { label: "Market", value: marketName || partner?.marketId || "Not set" },
    { label: "State", value: stateName || partner?.stateId || "Not set" },
    { label: "City", value: cityName || partner?.cityId || "Not set" },
    { label: "Address", value: partner?.address || "Not recorded", span: 2 },
    { label: "Invited", value: dateTime(partner?.createdAt) },
  ];

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading Hook Partner" errorTitle="Hook Partner could not be loaded" onRetry={() => query.refetch()}>
        {partner ? (
          <>
            <PageHeader
              title={name}
              description="Hook Partner location — drop-off custody point and assisted checkout."
              actions={
                <div className="flex items-center gap-2">
                  <PermissionGuard permission="partners.manage"><Button variant="outline" size="sm" onClick={openEdit}><Pencil /> Edit details</Button></PermissionGuard>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {status === "invited" ? <PermissionGuard permission="partners.manage"><DropdownMenuItem variant="destructive" onSelect={() => setAction("cancel-invitation")}><Mail /> Cancel invitation</DropdownMenuItem></PermissionGuard> : null}
                      {status === "active" || status === "suspended" ? (
                        <PermissionGuard permission="partners.manage">
                          <DropdownMenuItem onSelect={() => setAction(lifecycleAction)}>{status === "active" ? <Ban /> : <RotateCcw />} {status === "active" ? "Suspend location" : "Reactivate location"}</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setAction("revoke-sessions")}><KeyRound /> Revoke sessions</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setAction("archive")}><Archive /> Archive location</DropdownMenuItem>
                        </PermissionGuard>
                      ) : null}
                      {archived ? <PermissionGuard permission="partners.manage"><DropdownMenuItem onSelect={() => setAction("restore")}><RotateCcw /> Restore location</DropdownMenuItem></PermissionGuard> : null}
                      {archived ? <PermissionGuard permission="partners.manage"><DropdownMenuItem variant="destructive" onSelect={() => setAction("delete")}><Trash2 /> Delete permanently</DropdownMenuItem></PermissionGuard> : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
            />

            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-zinc-950 text-sm font-semibold text-amber-400 shadow-sm">{initials(name)}</span>
              <StatusBadge status={status} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Performance</h2>
              <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
                <TabsList>
                  {(Object.keys(periodLabel) as Period[]).map((key) => <TabsTrigger key={key} value={key}>{periodLabel[key]}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>

            <QueryState loading={analyticsQuery.isLoading} error={analyticsQuery.error} loadingLabel="Loading performance" errorTitle="Performance could not be loaded" onRetry={() => analyticsQuery.refetch()}>
              {analytics ? (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <MetricCard label={`Orders · ${periodLabel[period]}`} value={analytics.orders[period]} icon={ShoppingBag} />
                  <MetricCard label={`Revenue for Hook · ${periodLabel[period]}`} value={naira(analytics.revenueMinor[period])} icon={BadgeDollarSign} intent="success" />
                  <MetricCard label={`Accounts created · ${periodLabel[period]}`} value={analytics.customersCreated[period]} icon={UserPlus} caption="Customers this location signed up" />
                  <MetricCard label="Average order value" value={naira(analytics.averageOrderValueMinor)} icon={Package} caption={analytics.lastOrderAt ? `Last order ${dateTime(analytics.lastOrderAt)}` : "No orders yet"} />
                </div>
              ) : null}
            </QueryState>

            <DetailSection title="Contact" description="Who to reach at this Hook Partner location.">
              <DefinitionGrid items={contactItems} columns={3} />
            </DetailSection>

            <DetailSection title="Location" description="Where this Hook Partner operates.">
              <DefinitionGrid items={locationItems} columns={2} />
            </DetailSection>

            <PartnerActionDialog partner={partner} action={action} open={Boolean(action)} onClose={() => setAction(null)} onSuccess={() => { void query.refetch(); }} />

            <AdminWorkflowSheet
              open={editOpen}
              onOpenChange={(open) => { if (!open && !saving) setEditOpen(false); }}
              title="Edit Hook Partner details"
              description="Update the location's name, contact, and address."
              footer={<><Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" form="partner-edit-form" variant="brand" disabled={saving}>{saving ? <HookLoader size="button" /> : "Save changes"}</Button></>}
            >
              <form id="partner-edit-form" onSubmit={saveEdit} className="space-y-4">
                <div className="space-y-1.5"><Label htmlFor="edit-partner-name">Partner location name</Label><Input id="edit-partner-name" value={editValues.name} onChange={(event) => setEditValues((current) => ({ ...current, name: event.target.value }))} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="edit-partner-first-name">Contact first name</Label><Input id="edit-partner-first-name" value={editValues.firstName} onChange={(event) => setEditValues((current) => ({ ...current, firstName: event.target.value }))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="edit-partner-last-name">Contact last name</Label><Input id="edit-partner-last-name" value={editValues.lastName} onChange={(event) => setEditValues((current) => ({ ...current, lastName: event.target.value }))} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="edit-partner-phone">Phone</Label><Input id="edit-partner-phone" value={editValues.phone} onChange={(event) => setEditValues((current) => ({ ...current, phone: event.target.value }))} /></div>
                <div className="space-y-1.5"><Label htmlFor="edit-partner-address">Address</Label><Textarea id="edit-partner-address" value={editValues.address} onChange={(event) => setEditValues((current) => ({ ...current, address: event.target.value }))} rows={3} /></div>
              </form>
            </AdminWorkflowSheet>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
