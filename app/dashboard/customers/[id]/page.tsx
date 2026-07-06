"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError } from "@/lib/admin-utils";

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
      {query.isLoading && <Card><CardContent className="p-4"><HookLoader label="Loading customer..." /></CardContent></Card>}
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {customer && (
        <Card className="rounded-lg shadow-none">
          <CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Email</p><p>{customer.email}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{customer.phone || "Not set"}</p></div>
            <div><p className="text-muted-foreground">Status</p><StatusBadge status={customer.isActive ? "Active" : "Suspended"} /></div>
            <div><p className="text-muted-foreground">Verified</p><StatusBadge status={customer.isEmailVerified ? "Verified" : "Unverified"} /></div>
            <div><p className="text-muted-foreground">Last login</p><p>{customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString() : "Never"}</p></div>
            <div><p className="text-muted-foreground">Address</p><p>{customer.address ? JSON.stringify(customer.address) : "Not set"}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
