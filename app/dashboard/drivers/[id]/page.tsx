"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompactStatGrid } from "@/components/shared/CompactStatGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, number } from "@/lib/admin-utils";
import { StateChip } from "@/components/operations/StateDropdown";

interface DriverDetail {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  operationalStateCode?: string;
  operationalStateName?: string;
  jobs?: Array<{ id: string; status: string; order?: { orderCode?: string; total?: number } }>;
}

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<DriverDetail>(["admin", "drivers", id], `/admin/dispatch/drivers/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/dispatch/drivers/${id}/toggle`, ["admin", "drivers"], { successMessage: "Driver status updated" });
  const driver = query.data;
  const name = `${driver?.firstName || ""} ${driver?.lastName || ""}`.trim() || driver?.email || "Driver";

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={name} description={driver?.email || "Driver profile"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>{driver && <Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {driver.isActive ? "Deactivate" : "Activate"}</Button>}</>} />
      {query.isLoading && <Card><CardContent className="p-4"><HookLoader label="Loading driver..." /></CardContent></Card>}
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {driver && (
        <>
          <CompactStatGrid stats={[
            { label: "Jobs", value: number(driver.jobs?.length), tone: "blue" },
            { label: "Active", value: driver.isActive ? "Yes" : "No", tone: driver.isActive ? "green" : "red" },
            { label: "Delivered", value: number(driver.jobs?.filter((job) => job.status === "delivered").length), tone: "green" },
            { label: "In Transit", value: number(driver.jobs?.filter((job) => job.status === "in_transit").length), tone: "amber" },
          ]} />
          <Card className="rounded-lg shadow-none">
            <CardContent className="p-4">
              <div className="mb-3 grid gap-2 text-sm sm:grid-cols-4">
                <div><p className="text-muted-foreground">Email</p><p>{driver.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p>{driver.phone || "Not set"}</p></div>
                <div><p className="text-muted-foreground">Operating state</p><div className="mt-1"><StateChip name={driver.operationalStateName} /></div></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={driver.isActive ? "Active" : "Inactive"} /></div>
              </div>
              <h3 className="mb-2 text-sm font-semibold">Recent Jobs</h3>
              <div className="divide-y rounded-md border">
                {(driver.jobs || []).map((job) => (
                  <div key={job.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{job.order?.orderCode || job.id.slice(0, 8)}</span>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
                {!driver.jobs?.length && <p className="p-3 text-sm text-muted-foreground">No assignments yet.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
