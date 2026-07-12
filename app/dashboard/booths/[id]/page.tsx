"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError } from "@/lib/admin-utils";
import { StateChip } from "@/components/operations/StateDropdown";

interface Booth { id: string; name: string; description?: string; isActive: boolean; boothType: string; location?: { address?: string; lat?: number; lng?: number; stateName?: string }; previewImageUrl?: string; }

export default function BoothDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Booth>(["admin", "booths", id], `/admin/booths/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/booths/${id}/status`, ["admin", "booths"], { successMessage: "Booth status updated" });
  const booth = query.data;
  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={booth?.name || "Booth Detail"} description={booth?.location?.address || "Physical booth profile"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>{booth && <Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {booth.isActive ? "Deactivate" : "Activate"}</Button>}</>} />
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {booth && <Card className="rounded-lg shadow-none"><CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2"><div><p className="text-muted-foreground">Status</p><StatusBadge status={booth.isActive ? "Active" : "Inactive"} /></div><div><p className="text-muted-foreground">Type</p><p>{booth.boothType}</p></div><div><p className="text-muted-foreground">Operating state</p><div className="mt-1"><StateChip name={booth.location?.stateName} /></div></div><div><p className="text-muted-foreground">Coordinates</p><p>{booth.location?.lat || 0}, {booth.location?.lng || 0}</p></div><div><p className="text-muted-foreground">Description</p><p>{booth.description || "No description"}</p></div></CardContent></Card>}
    </div>
  );
}
