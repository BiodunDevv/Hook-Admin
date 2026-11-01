"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";
import { AuditLogDetailSheet } from "@/components/audit-log/AuditLogDetailSheet";
import { AuditLogFilters, emptyAuditFilters, type AuditLogFiltersValue } from "@/components/audit-log/AuditLogFilters";
import { rangeStart } from "@/components/audit-log/audit-log-utils";
import { Button } from "@/components/ui/button";
import { AuditLogOverview } from "@/components/audit-log/AuditLogOverview";
import { AuditLogTimeline } from "@/components/audit-log/AuditLogTimeline";
import type { AuditLogEvent, AuditLogFacets, AuditLogListResponse } from "@/components/audit-log/audit-log-types";

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const { data: session } = useAdminSession();
  const [filters, setFilters] = useState<AuditLogFiltersValue>(emptyAuditFilters);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<AuditLogEvent | null>(null);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const from = useMemo(() => rangeStart(filters.range), [filters.range]);
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (deferredSearch) params.set("q", deferredSearch);
    if (filters.entityType !== "all") params.set("entityType", filters.entityType);
    if (from) params.set("from", from);
    return params.toString();
  }, [deferredSearch, filters.entityType, from, limit]);
  const allowed = hasPermission(session, "audit.view");
  const enabled = Boolean(session && allowed);
  const query = useApiQuery<AuditLogListResponse>(["admin", "audit-logs", queryString], `/admin/audit-logs?${queryString}`, enabled);
  const facets = useApiQuery<AuditLogFacets>(["admin", "audit-logs", "facets"], "/admin/audit-logs/facets", enabled);
  const events = query.data?.data || [];
  const total = query.data?.total ?? events.length;
  const filtered = Boolean(deferredSearch || filters.entityType !== "all" || filters.range !== "all");

  function changeFilters(next: AuditLogFiltersValue) {
    setFilters(next);
    setLimit(PAGE_SIZE);
  }

  if (session && !allowed) {
    return <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center"><div><ClipboardList className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Audit log access is restricted</h1><p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view the platform audit log.</p></div></div>;
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Audit Log" description="Append-only security and operational change history across the platform." />
      <AuditLogOverview events={events} total={facets.data?.total ?? total} today={facets.data?.today ?? 0} />
      <AuditLogFilters value={filters} onChange={changeFilters} entityTypes={facets.data?.entityTypes || []} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading audit history" errorTitle="Audit log unavailable" empty={!query.isLoading && !query.isError && !events.length} emptyIcon={ClipboardList} emptyTitle="No audit events found" emptyDescription="Adjust the filters or check back after the next operational change." onRetry={() => query.refetch()}>
        <AuditLogTimeline events={events} onSelect={setSelected} filtered={filtered} />
        {events.length < total ? (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>Showing {events.length} of {total}</span>
            <Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => setLimit((current) => current + PAGE_SIZE)}>{query.isFetching ? "Loading…" : "Load more"}</Button>
          </div>
        ) : null}
      </QueryState>
      <AuditLogDetailSheet event={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
