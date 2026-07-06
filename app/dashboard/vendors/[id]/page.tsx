"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Edit3, Mail, Package, Phone, Power, Store, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, money, number } from "@/lib/admin-utils";

interface VendorDetail {
  id: string;
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  description?: string;
  tier: string;
  isApproved: boolean;
  isActive: boolean;
  commissionPercentage: number;
  owner?: { email?: string; firstName?: string; lastName?: string };
  products?: Array<{ id: string; title: string; status: string; quantity: number }>;
  settlements?: Array<{ id: string; netAmount: number; status: string }>;
  metrics?: { gmv: number; orders: number; products: number };
}

function vendorStatus(vendor: VendorDetail) {
  if (!vendor.isApproved) return "Pending";
  if (!vendor.isActive) return "Inactive";
  return "Active";
}

export default function VendorDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<VendorDetail>(["admin", "vendors", id], `/admin/vendors/${id}`, Boolean(id));
  const approve = useApiPatch<VendorDetail, undefined>(`/admin/vendors/${id}/approve`, ["admin", "vendors"], { successMessage: "Vendor approved" });
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/vendors/${id}/toggle`, ["admin", "vendors"], { successMessage: "Vendor status updated" });
  const updateVendor = useApiPatch<VendorDetail, Record<string, unknown>>(`/admin/vendors/${id}`, ["admin", "vendors"], { successMessage: "Vendor updated" });
  const [editing, setEditing] = useState(false);
  const vendor = query.data;
  const owner = `${vendor?.owner?.firstName || ""} ${vendor?.owner?.lastName || ""}`.trim() || vendor?.owner?.email || "Owner";

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title={vendor?.businessName || "Vendor Detail"}
        description={vendor?.businessEmail || "Vendor profile, catalog, and settlement overview."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>
            {vendor && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 size={15} /> Edit</Button>}
            {vendor && !vendor.isApproved && <Button size="sm" variant="brand" onClick={() => approve.mutate(undefined)}><Check size={15} /> Approve</Button>}
            {vendor && <Button size="sm" variant="outline" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {vendor.isActive ? "Deactivate" : "Activate"}</Button>}
          </>
        }
      />

      {query.isLoading && <Card className="rounded-lg shadow-card"><CardContent className="p-4"><HookLoader label="Loading vendor..." /></CardContent></Card>}
      {query.error && <Card className="rounded-lg border-red-200 bg-red-50 shadow-none"><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}

      {vendor && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={Wallet} tone="blue" label="GMV" value={money(vendor.metrics?.gmv)} caption="Fulfilled item value" />
            <KpiCard icon={Store} tone="green" label="Orders" value={number(vendor.metrics?.orders)} caption={vendorStatus(vendor)} />
            <KpiCard icon={Package} tone="amber" label="Products" value={number(vendor.metrics?.products)} caption={vendor.tier} />
            <KpiCard icon={Power} tone={vendor.isActive ? "green" : "red"} label="Commission" value={`${vendor.commissionPercentage}%`} caption={vendor.isApproved ? "Approved" : "Pending review"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
              <CardContent className="space-y-4 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Status</span>
                  <StatusBadge status={vendorStatus(vendor)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Tier</span>
                  <StatusBadge status={vendor.tier} />
                </div>
                <div>
                  <p className="text-zinc-500">Owner</p>
                  <p className="mt-1 font-medium text-zinc-900">{owner}</p>
                  <p className="text-xs text-zinc-400">{vendor.owner?.email}</p>
                </div>
                <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="flex items-center gap-2 text-zinc-600"><Mail size={14} /> {vendor.businessEmail || "No email"}</p>
                  <p className="flex items-center gap-2 text-zinc-600"><Phone size={14} /> {vendor.businessPhone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Address</p>
                  <p className="mt-1 leading-6 text-zinc-700">{vendor.businessAddress || "Not set"}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Description</p>
                  <p className="mt-1 leading-6 text-zinc-700">{vendor.description || "No description"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-zinc-200 py-0 shadow-card lg:col-span-2">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">Products</h3>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/products?vendorId=${vendor.id}`}>View catalog</Link>
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border border-zinc-200">
                  {(vendor.products || []).slice(0, 10).map((product) => (
                    <Link key={product.id} href={`/dashboard/products/${product.id}`} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-3 text-sm last:border-0 hover:bg-zinc-50">
                      <span className="min-w-0 truncate font-medium text-zinc-900">{product.title}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={product.status} />
                        <span className="text-xs text-zinc-400">{product.quantity} stock</span>
                      </span>
                    </Link>
                  ))}
                  {!vendor.products?.length && <p className="p-4 text-sm text-zinc-500">No products yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {vendor && (
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-w-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit vendor</DialogTitle>
              <DialogDescription>Update business profile, tier, commission, and status.</DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
                await updateVendor.mutateAsync({
                  businessName: payload.businessName,
                  businessEmail: payload.businessEmail || undefined,
                  businessPhone: payload.businessPhone || undefined,
                  businessAddress: payload.businessAddress || undefined,
                  description: payload.description || undefined,
                  tier: payload.tier,
                  commissionPercentage: Number(payload.commissionPercentage || 15),
                  isApproved: payload.isApproved === "true",
                  isActive: payload.isActive === "true",
                });
                query.refetch();
                setEditing(false);
              }}
            >
              <div className="space-y-1.5 sm:col-span-2"><Label>Business name</Label><Input name="businessName" defaultValue={vendor.businessName} required /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input name="businessEmail" type="email" defaultValue={vendor.businessEmail} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input name="businessPhone" defaultValue={vendor.businessPhone} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input name="businessAddress" defaultValue={vendor.businessAddress} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><textarea name="description" defaultValue={vendor.description} className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" /></div>
              <div className="space-y-1.5"><Label>Tier</Label><select name="tier" defaultValue={vendor.tier} className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="tier_1">Tier 1</option><option value="tier_2">Tier 2</option><option value="tier_3">Tier 3</option></select></div>
              <div className="space-y-1.5"><Label>Commission %</Label><Input name="commissionPercentage" type="number" defaultValue={vendor.commissionPercentage} /></div>
              <div className="space-y-1.5"><Label>Approved</Label><select name="isApproved" defaultValue={String(vendor.isApproved)} className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="true">Approved</option><option value="false">Pending</option></select></div>
              <div className="space-y-1.5"><Label>Active</Label><select name="isActive" defaultValue={String(vendor.isActive)} className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="true">Active</option><option value="false">Inactive</option></select></div>
              <div className="flex justify-end sm:col-span-2"><Button type="submit" variant="brand" disabled={updateVendor.isPending}>{updateVendor.isPending ? <HookLoader size="button" label="Saving..." /> : "Save changes"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
