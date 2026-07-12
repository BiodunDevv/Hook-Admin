"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPost } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";
import { StateDropdown } from "@/components/operations/StateDropdown";

export default function NewVendorPage() {
  const router = useRouter();
  const [stateCode, setStateCode] = useState("LA");
  const createVendor = useApiPost<{ id: string }, Record<string, unknown>>("/admin/vendors", ["admin", "vendors"], { successMessage: "Vendor onboarded" });

  async function submit(formData: FormData) {
    const payload = Object.fromEntries(formData.entries());
    const vendor = await createVendor.mutateAsync({
      ...payload,
      commissionPercentage: Number(payload.commissionPercentage || 15),
      isApproved: payload.isApproved === "on",
      isActive: true,
    });
    router.push(`/dashboard/vendors/${vendor.id}`);
  }

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader
        title="Onboard Vendor"
        description="Create the owner account and vendor profile in one flow."
        actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>}
      />
      <form action={submit}>
        <Card className="max-w-4xl rounded-lg shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
            {[
              ["ownerEmail", "Owner Email", "email"],
              ["ownerFirstName", "Owner First Name", "text"],
              ["ownerLastName", "Owner Last Name", "text"],
              ["ownerPhone", "Owner Phone", "tel"],
              ["businessName", "Business Name", "text"],
              ["businessEmail", "Business Email", "email"],
              ["businessPhone", "Business Phone", "tel"],
              ["businessAddress", "Business Address", "text"],
            ].map(([name, label, type]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} type={type} required={["ownerEmail", "businessName"].includes(name)} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Operating state</Label>
              <input type="hidden" name="stateCode" value={stateCode} />
              <StateDropdown mode="form" value={stateCode} onChange={setStateCode} className="h-9 w-full justify-between gap-2 text-zinc-700" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier">Tier</Label>
              <select id="tier" name="tier" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="tier_3">
                <option value="tier_1">Tier 1</option>
                <option value="tier_2">Tier 2</option>
                <option value="tier_3">Tier 3</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commissionPercentage">Commission %</Label>
              <Input id="commissionPercentage" name="commissionPercentage" type="number" defaultValue="15" min="0" max="100" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea id="description" name="description" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isApproved" className="size-4" />
              Approve immediately
            </label>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" variant="brand" disabled={createVendor.isPending}>
                {createVendor.isPending ? <HookLoader size="button" label="Creating..." /> : "Create Vendor"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
