"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Plus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";
import { StaffActionDialog } from "@/components/staff/StaffActionDialog";
import { StaffCreateDialog } from "@/components/staff/StaffCreateDialog";
import { StaffDirectory } from "@/components/staff/StaffDirectory";
import { StaffFilters, type StaffFiltersValue } from "@/components/staff/StaffFilters";
import { StaffOverview } from "@/components/staff/StaffOverview";
import type { StaffAction, StaffListResponse, StaffMember } from "@/components/staff/staff-types";

const initialFilters: StaffFiltersValue = { search: "", role: "all", status: "all", scope: "all" };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

export default function StaffPage() {
  const { data: session } = useAdminSession();
  const [filters, setFilters] = useState<StaffFiltersValue>(initialFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<{ member: StaffMember; action: StaffAction } | null>(null);
  const deferredSearch = useDeferredValue(filters.search.trim());
  const queryString = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (deferredSearch) params.set("q", deferredSearch);
    if (filters.role !== "all") params.set("role", filters.role);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.scope !== "all") params.set("scopeType", filters.scope);
    return params.toString();
  }, [deferredSearch, filters.role, filters.scope, filters.status]);
  const allowed = hasPermission(session, "staff.view");
  const query = useApiQuery<StaffListResponse>(["admin", "staff", queryString], `/admin/staff?${queryString}`, Boolean(session && allowed));
  const staff = query.data?.data || [];

  async function resendInvitation(member: StaffMember) {
    try {
      await apiPost(`/admin/staff/${member.publicId || member.id}/resend-invitation`, {});
      toast.success("Invitation sent again");
      await query.refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to resend invitation"));
    }
  }

  if (session && !allowed) {
    return <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center p-6 text-center"><div><UserCog className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Staff access is restricted</h1><p className="mt-1 text-sm text-muted-foreground">Your current role does not include permission to view staff accounts.</p></div></div>;
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Staff" description="Manage team identities, role-based access, and operational scope." actions={<PermissionGuard permission="staff.create"><Button variant="brand" onClick={() => setCreateOpen(true)}><Plus /> Add staff member</Button></PermissionGuard>} />
      <StaffOverview staff={staff} />
      <StaffFilters value={filters} onChange={setFilters} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading staff directory" errorTitle="Staff directory unavailable" empty={!query.isLoading && !query.isError && !staff.length} emptyIcon={UserCog} emptyTitle="No staff members found" emptyDescription="Adjust the filters or create the first staff invitation." onRetry={() => query.refetch()}>
        <StaffDirectory staff={staff} currentUserId={session?.id} onAction={(member, nextAction) => setAction({ member, action: nextAction })} onResend={(member) => void resendInvitation(member)} />
      </QueryState>
      <StaffCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => query.refetch()} />
      <StaffActionDialog member={action?.member || null} action={action?.action || null} open={Boolean(action)} onClose={() => setAction(null)} onSuccess={() => query.refetch()} />
    </div>
  );
}
