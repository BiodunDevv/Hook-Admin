"use client";

import { useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";

type AvailabilitySettings = {
  catalogAvailabilityCheckDays: number;
  overdueCount: number;
  updatedAt?: string;
};

export function CatalogAvailabilitySection() {
  const session = useAdminSession();
  const query = useApiQuery<AvailabilitySettings>(
    ["admin", "catalog-availability-settings"],
    "/admin/settings/catalog-availability",
  );
  const [daysDraft, setDaysDraft] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = hasPermission(session.data, "catalog.availability.manage");

  const days = daysDraft ?? String(query.data?.catalogAvailabilityCheckDays || 4);

  async function save() {
    const value = Number(days);
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      toast.error("Use a check window between 1 and 30 days");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Add an audit reason before saving");
      return;
    }
    setSaving(true);
    try {
      await apiPatch("/admin/settings/catalog-availability", {
        catalogAvailabilityCheckDays: value,
        reason: reason.trim(),
      });
      toast.success("Availability policy updated");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update availability policy");
    } finally {
      setSaving(false);
    }
  }

  if (!hasPermission(session.data, "catalog.availability.view")) {
    return <QueryState empty emptyTitle="Availability policy unavailable" emptyDescription="Your account does not have access to catalog availability settings." />;
  }
  if (query.isLoading) return <div className="grid min-h-56 place-items-center"><HookLoader label="Loading availability policy" /></div>;
  if (query.isError) return <QueryState error={query.error} errorTitle="Availability policy could not load" onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-4">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="size-5 text-brand-gold" /> Catalog availability checks</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Products that need supplier confirmation are hidden from customers until an assigned Runner confirms them.</p>
        </CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4 text-brand-gold" /> Current check window</div>
              <p className="mt-2 text-3xl font-semibold">{query.data?.catalogAvailabilityCheckDays || 4} <span className="text-base font-normal text-muted-foreground">days</span></p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">The Runner receives the request first. After the deadline, the product remains unavailable and appears overdue.</p>
            </div>
            <div className={`rounded-lg border p-4 ${Number(query.data?.overdueCount || 0) ? "border-amber-200 bg-amber-50" : "bg-muted/20"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-amber-600" /> Overdue checks</div>
              <p className="mt-2 text-3xl font-semibold">{query.data?.overdueCount || 0}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Overdue products are never republished automatically.</p>
            </div>
          </div>

          {canManage ? (
            <div className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="availability-days">Default check window (days)</Label><Input id="availability-days" type="number" min={1} max={30} value={days} onChange={(event) => setDaysDraft(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="availability-reason">Audit reason</Label><Input id="availability-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this policy changing?" maxLength={500} /></div>
              <div className="sm:col-span-2 flex justify-end"><Button variant="brand" disabled={saving} onClick={() => void save()}>{saving ? <HookLoader size="button" /> : <><Save className="size-4" /> Save policy</>}</Button></div>
            </div>
          ) : <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">You can view this policy, but only authorized catalog operations staff can change it.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
