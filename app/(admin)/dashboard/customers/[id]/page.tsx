"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Button } from "@/components/ui/button";
import { useApiPatch, useApiQuery } from "@/lib/query";

interface CustomerDetail {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  address?: Record<string, unknown>;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<CustomerDetail>(["admin", "customers", id], `/admin/users/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/users/${id}/toggle`, ["admin", "customers"], { successMessage: "Customer status updated" });
  const customer = query.data;
  const name = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || customer?.email || "Customer";

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={name} description={customer?.email || "Customer profile"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>{customer && <Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {customer.isActive ? "Suspend" : "Activate"}</Button>}</>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading customer" onRetry={() => query.refetch()}>
        {customer ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <DetailSection title="Customer profile" description="Verified identity and account contact information.">
              <DefinitionGrid items={[
                { label: "Email", value: customer.email },
                { label: "Phone", value: customer.phone || "Not set" },
                { label: "Account status", value: <StatusBadge status={customer.isActive ? "Active" : "Suspended"} /> },
                { label: "Email verification", value: <StatusBadge status={customer.isEmailVerified ? "Verified" : "Unverified"} /> },
              ]} />
            </DetailSection>
            <div className="space-y-4">
              <DetailSection title="Account activity" description="Most recent authentication activity.">
                <DefinitionGrid columns={1} items={[{ label: "Last login", value: customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString("en-NG") : "Never" }]} />
              </DetailSection>
              <DetailSection title="Default address" description="Current customer delivery information.">
                <DefinitionGrid columns={1} items={customer.address ? Object.entries(customer.address).map(([key, value]) => ({ label: key.replace(/([A-Z])/g, " $1"), value: String(value || "Not set") })) : [{ label: "Address", value: "Not set" }]} />
              </DetailSection>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
