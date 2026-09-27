"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { ArchiveTabs, type DirectoryTab } from "@/components/shared/ArchiveTabs";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { PartnerActionDialog } from "@/components/partners/PartnerActionDialog";
import { PartnerCreateDialog } from "@/components/partners/PartnerCreateDialog";
import { PartnerDirectory } from "@/components/partners/PartnerDirectory";
import { PartnerFilters, type PartnerFiltersValue } from "@/components/partners/PartnerFilters";
import { PartnerOverview } from "@/components/partners/PartnerOverview";
import type { Partner, PartnerAction, PartnerListResponse } from "@/components/partners/partner-types";

type GeoOption = { id?: string; publicId?: string; name?: string };
type GeoResponse = GeoOption[] | { data?: GeoOption[] };

const initialFilters: PartnerFiltersValue = { search: "", status: "all" };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

function nameMap(response: GeoResponse | undefined) {
  const rows = Array.isArray(response) ? response : response?.data || [];
  const map = new Map<string, string>();
  rows.forEach((row) => {
    const id = row.id || row.publicId;
    if (id && row.name) map.set(String(id), row.name);
  });
  return map;
}

export default function PartnersPage() {
  const { data: session } = useAdminSession();
  const [filters, setFilters] = useState<PartnerFiltersValue>(initialFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<DirectoryTab>("active");
  const [action, setAction] = useState<{ partner: Partner; action: PartnerAction } | null>(null);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (deferredSearch) params.set("search", deferredSearch);
    if (tab === "archived") params.set("status", "disabled");
    else if (filters.status !== "all") params.set("status", filters.status);
    return params.toString();
  }, [deferredSearch, filters.status, tab]);

  const allowed = hasPermission(session, "partners.view");
  const query = useApiQuery<PartnerListResponse>(["admin", "partners", queryString], `/admin/partners?${queryString}`, Boolean(session && allowed));
  const partners = query.data?.data || [];

  const statesQuery = useApiQuery<GeoResponse>(["admin", "states", "partners"], "/admin/states?limit=100", Boolean(session && allowed));
  const citiesQuery = useApiQuery<GeoResponse>(["admin", "cities", "partners"], "/admin/cities?limit=200", Boolean(session && allowed));
  const marketsQuery = useApiQuery<GeoResponse>(["admin", "markets", "partners"], "/admin/markets?limit=200", Boolean(session && allowed));
  const stateNames = useMemo(() => nameMap(statesQuery.data), [statesQuery.data]);
  const cityNames = useMemo(() => nameMap(citiesQuery.data), [citiesQuery.data]);
  const marketNames = useMemo(() => nameMap(marketsQuery.data), [marketsQuery.data]);

  async function resendInvitation(partner: Partner) {
    try {
      await apiPost(`/admin/partners/${partner.publicId || partner.id}/resend-invitation`, {});
      toast.success("Invitation sent again");
      await query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to resend invitation"));
    }
  }

  if (session && !allowed) {
    return <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center"><div><Store className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Hook Partner access is restricted</h1><p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view Hook Partner accounts.</p></div></div>;
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Hook Partners" description="Manage authenticated Hook Partner locations — drop-off custody points and assisted checkout, per State and Market." actions={<PermissionGuard permission="partners.manage"><Button variant="brand" onClick={() => setCreateOpen(true)}><Plus /> Invite Hook Partner</Button></PermissionGuard>} />
      <ArchiveTabs value={tab} onChange={setTab} />
      {tab === "active" ? <PartnerOverview partners={partners} /> : null}
      <PartnerFilters value={filters} onChange={setFilters} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading Hook Partner directory" errorTitle="Hook Partner directory unavailable" empty={!query.isLoading && !query.isError && !partners.length} emptyIcon={Store} emptyTitle="No Hook Partners found" emptyDescription="Adjust the filters or invite the first Hook Partner location." onRetry={() => query.refetch()}>
        <PartnerDirectory partners={partners} stateNames={stateNames} cityNames={cityNames} marketNames={marketNames} onAction={(partner, nextAction) => setAction({ partner, action: nextAction })} onResend={(partner) => void resendInvitation(partner)} />
      </QueryState>
      <PartnerCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => query.refetch()} />
      <PartnerActionDialog partner={action?.partner || null} action={action?.action || null} open={Boolean(action)} onClose={() => setAction(null)} onSuccess={() => query.refetch()} />
    </div>
  );
}
