"use client";

import { ExternalLink, LifeBuoy, Mail, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaqManagementSection } from "@/components/support/FaqManagementSection";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiQuery } from "@/lib/query";
import { apiPatch } from "@/lib/api";
import { cleanError, type Page } from "@/lib/admin-utils";

type DeletionRequest = {
  id: string;
  status: string;
  reason?: string;
  coolingOffUntil: string;
  paused?: boolean;
  source?: string;
  deferReason?: string;
  user?: { email?: string; firstName?: string; lastName?: string };
};

type SupportContact = { supportEmail?: string; supportUrl?: string };

const OPEN_STATUSES = ["cooling_off", "requested", "identity_verified", "approved"];

export default function SupportPage() {
  const query = useApiQuery<Page<DeletionRequest>>(["admin", "deletion-requests"], "/admin/support/deletion-requests?limit=50");
  const support = useApiQuery<SupportContact>(["public-support"], "/public/support");
  const requests = query.data?.data || [];
  const open = requests.filter((request) => OPEN_STATUSES.includes(request.status) && !request.paused);
  const paused = requests.filter((request) => request.paused);

  async function update(id: string, action: "pause" | "resume" | "cancel" | "erase_now") {
    if (action === "erase_now" && !window.confirm("Erase this account now? This permanently deletes their personal data and cannot be undone.")) return;
    try {
      await apiPatch(`/admin/support/deletion-requests/${id}`, { action });
      toast.success("Deletion request updated");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error));
    }
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Support Operations" description="Customer account deletions, plus where every client's Help & Support points to." actions={<Button variant="outline" size="sm" asChild><Link href="/help" target="_blank"><ExternalLink /> Preview /help</Link></Button>} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Open requests" value={requests.length ? open.length : "—"} icon={Timer} intent={open.length ? "warning" : "neutral"} />
        <MetricCard label="Paused" value={paused.length} icon={ShieldCheck} />
        <MetricCard label="Support email" value={support.data?.supportEmail || "Not set"} icon={Mail} />
        <MetricCard label="Help & Support URL" value={support.data?.supportUrl ? "Configured" : "Default"} icon={LifeBuoy} caption={support.data?.supportUrl} />
      </div>

      <Card className="rounded-lg shadow-none py-2">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><LifeBuoy className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Where support opens</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Every client - the app, Market Associate portal, and Partner portal — opens this same address.</p>
              <p className="mt-1.5 truncate font-mono text-xs text-muted-foreground">{support.data?.supportUrl || "Not configured yet"}</p>
            </div>
          </div>
          <PermissionGuard permission="settings.view">
            <Button variant="outline" size="sm" className="shrink-0" asChild><Link href="/dashboard/settings?section=email-configuration">Manage in Email Settings</Link></Button>
          </PermissionGuard>
        </CardContent>
      </Card>

      <Tabs defaultValue="deletions">
        <TabsList>
          <TabsTrigger value="deletions">Account deletion</TabsTrigger>
          <PermissionGuard permission="faq.view"><TabsTrigger value="faqs">FAQ</TabsTrigger></PermissionGuard>
        </TabsList>

        <TabsContent value="deletions" className="mt-4">
          <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-none">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Account deletion requests</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">Erasure runs automatically when the cooling-off period ends; pause, cancel, or erase early here.</p>
            </CardHeader>
            <CardContent className="p-0">
              <QueryState
                loading={query.isLoading}
                error={query.error}
                empty={!query.isLoading && !query.isError && !requests.length}
                loadingLabel="Loading support requests…"
                errorTitle="Support requests could not be loaded"
                emptyTitle="No deletion requests"
                emptyDescription="Customer support requests will appear here."
                emptyIcon={ShieldCheck}
                onRetry={() => query.refetch()}
              >
                <div>
                  {requests.map((item) => (
                    <div key={item.id} className="border-b p-4 last:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.user?.email || "Customer account"}</p>
                          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{item.reason || "No reason supplied"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.status === "cooling_off" ? "Erases automatically on " : "Cooling off until "}
                            {new Date(item.coolingOffUntil).toLocaleString()}
                            {item.source ? ` · requested via ${item.source}` : ""}
                            {item.paused ? " · PAUSED" : ""}
                          </p>
                          {item.deferReason ? <p className="mt-1 text-xs text-amber-600">Deferred: {item.deferReason}</p> : null}
                        </div>
                        <StatusBadge status={item.paused ? "paused" : item.status} />
                      </div>
                      {OPEN_STATUSES.includes(item.status) ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => update(item.id, item.paused ? "resume" : "pause")}>{item.paused ? "Resume erasure" : "Pause erasure"}</Button>
                          <Button size="sm" variant="outline" onClick={() => update(item.id, "cancel")}>Cancel request &amp; restore account</Button>
                          <Button size="sm" variant="destructive" onClick={() => update(item.id, "erase_now")}>Erase now</Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <PermissionGuard permission="faq.view">
          <TabsContent value="faqs" className="mt-4">
            <FaqManagementSection />
          </TabsContent>
        </PermissionGuard>
      </Tabs>
    </div>
  );
}
