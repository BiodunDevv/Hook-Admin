"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";
import { AuditLogDetailSheet } from "@/components/audit-log/AuditLogDetailSheet";
import { AuditLogFilters, type AuditLogFiltersValue } from "@/components/audit-log/AuditLogFilters";
import { AuditLogOverview } from "@/components/audit-log/AuditLogOverview";
import { AuditLogTimeline } from "@/components/audit-log/AuditLogTimeline";
import type { AuditLogEvent, AuditLogListResponse } from "@/components/audit-log/audit-log-types";

const initialFilters: AuditLogFiltersValue = { search: "", entityType: "all" };

export default function AuditLogsPage() {
  const { data: session } = useAdminSession();
  const [filters, setFilters] = useState<AuditLogFiltersValue>(initialFilters);
  const [selected, setSelected] = useState<AuditLogEvent | null>(null);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (deferredSearch) params.set("q", deferredSearch);
    if (filters.entityType !== "all") params.set("entityType", filters.entityType);
    return params.toString();
  }, [deferredSearch, filters.entityType]);
  const allowed = hasPermission(session, "audit.view");
  const query = useApiQuery<AuditLogListResponse>(["admin", "audit-logs", queryString], `/admin/audit-logs?${queryString}`, Boolean(session && allowed));
  const events = query.data?.data || [];
  const total = query.data?.total ?? events.length;

  if (session && !allowed) {
    return <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center"><div><ClipboardList className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Audit log access is restricted</h1><p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view the platform audit log.</p></div></div>;
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Audit Log" description="Append-only security and operational change history across the platform." />
      <AuditLogOverview events={events} total={total} />
      <AuditLogFilters value={filters} onChange={setFilters} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading audit history" errorTitle="Audit log unavailable" empty={!query.isLoading && !query.isError && !events.length} emptyIcon={ClipboardList} emptyTitle="No audit events found" emptyDescription="Adjust the filters or check back after the next operational change." onRetry={() => query.refetch()}>
        <AuditLogTimeline events={events} onSelect={setSelected} />
      </QueryState>
      <AuditLogDetailSheet event={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
