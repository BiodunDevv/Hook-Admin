"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { MarketAssociateActionDialog } from "@/components/market-associates/MarketAssociateActionDialog";
import { MarketAssociateCreateDialog } from "@/components/market-associates/MarketAssociateCreateDialog";
import { MarketAssociateDirectory } from "@/components/market-associates/MarketAssociateDirectory";
import { MarketAssociateFilters, type MarketAssociateFiltersValue } from "@/components/market-associates/MarketAssociateFilters";
import { MarketAssociateOverview } from "@/components/market-associates/MarketAssociateOverview";
import type { MarketAssociateAction, MarketAssociateListResponse, MarketAssociateMember } from "@/components/market-associates/market-associate-types";

const initialFilters: MarketAssociateFiltersValue = { search: "", status: "all", availability: "all" };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

export default function MarketAssociatesPage() {
  const { data: session } = useAdminSession();
  const [filters, setFilters] = useState<MarketAssociateFiltersValue>(initialFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<{ member: MarketAssociateMember; action: MarketAssociateAction } | null>(null);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (deferredSearch) params.set("q", deferredSearch);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.availability !== "all") params.set("availability", filters.availability);
    return params.toString();
  }, [deferredSearch, filters.availability, filters.status]);
  const allowed = hasPermission(session, "runners.view");
  const query = useApiQuery<MarketAssociateListResponse>(["admin", "market-associates", queryString], `/admin/market-associates?${queryString}`, Boolean(session && allowed));
  const members = query.data?.data || [];

  async function resendInvitation(member: MarketAssociateMember) {
    try {
      await apiPost(`/admin/market-associates/${member.publicId || member.id}/resend-invitation`, {});
      toast.success("Invitation sent again");
      await query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to resend invitation"));
    }
  }

  if (session && !allowed) {
    return <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center"><div><Users className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Market Associate access is restricted</h1><p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view Market Associate accounts.</p></div></div>;
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Market Associates" description="Manage Market Associate identities, availability, operational scope, and Market assignments." actions={<PermissionGuard permission="runners.manage"><Button variant="brand" onClick={() => setCreateOpen(true)}><Plus /> Add Market Associate</Button></PermissionGuard>} />
      <MarketAssociateOverview members={members} />
      <MarketAssociateFilters value={filters} onChange={setFilters} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading Market Associate directory" errorTitle="Market Associate directory unavailable" empty={!query.isLoading && !query.isError && !members.length} emptyIcon={Users} emptyTitle="No Market Associates found" emptyDescription="Adjust the filters or create the first Market Associate invitation." onRetry={() => query.refetch()}>
        <MarketAssociateDirectory members={members} onAction={(member, nextAction) => setAction({ member, action: nextAction })} onResend={(member) => void resendInvitation(member)} />
      </QueryState>
      <MarketAssociateCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => query.refetch()} />
      <MarketAssociateActionDialog member={action?.member || null} action={action?.action || null} open={Boolean(action)} onClose={() => setAction(null)} onSuccess={() => query.refetch()} />
    </div>
  );
}
