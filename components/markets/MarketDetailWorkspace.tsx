"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock3, Edit3, MapPin, Navigation, Power, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { DetailSection } from "@/components/shared/DetailSection";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { MarketFormDialog } from "./MarketFormDialog";
import { MarketImage } from "./MarketImage";
import type { MarketRecord } from "./market-types";

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString("en-NG") : "Not recorded";
}

export function MarketDetailWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useAdminSession();
  const [editing, setEditing] = useState(false);
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const query = useApiQuery<MarketRecord>(["admin", "market", params.id], `/admin/markets/${params.id}`);
  const market = query.data;
  const canManage = hasPermission(session, "markets.manage");

  async function changeLifecycle() {
    if (!market || reason.trim().length < 3) return;
    setActing(true);
    try {
      const suffix = market.status === "active" ? "deactivate" : "activate";
      await apiPost(`/admin/markets/${market.publicId || market.id}/${suffix}`, { reason: reason.trim() });
      toast.success(`Market ${suffix === "activate" ? "activated" : "deactivated"}`);
      setLifecycleOpen(false);
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to update market status");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 pb-10 md:p-5">
      <PageHeader title={market?.name || "Market details"} description={market?.publicId ? `Market workspace · ${market.publicId}` : "Market workspace"} actions={<div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back</Button>{market?.status ? <StatusBadge status={market.status} /> : null}{market && canManage ? <PermissionGuard permission="markets.manage"><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 /> Edit</Button></PermissionGuard> : null}{market && canManage ? <PermissionGuard permission="markets.manage"><Button variant={market.status === "active" ? "destructive" : "brand"} size="sm" onClick={() => setLifecycleOpen(true)}><Power /> {market.status === "active" ? "Deactivate" : "Activate"}</Button></PermissionGuard> : null}</div>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading market workspace" errorTitle="Market details unavailable" onRetry={() => query.refetch()}>
        {market ? <>
          <Card className="overflow-hidden rounded-xl shadow-none">
            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <div className="relative min-h-64 bg-muted lg:min-h-80"><MarketImage src={market.imageUrl} alt={`${market.name} market`} className="size-full" /></div>
              <div className="flex flex-col justify-between gap-6 p-5 md:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a00]">Operating market</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{market.name}</h2><p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-1 size-4 shrink-0 text-[#b18b00]" />{market.address}</p></div><div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm"><div><p className="text-xs text-muted-foreground">State</p><p className="mt-1 font-semibold">{market.stateName || market.state?.name || "Not assigned"}</p></div><div><p className="text-xs text-muted-foreground">City</p><p className="mt-1 font-semibold">{market.cityName || market.city?.name || "Not assigned"}</p></div><div><p className="text-xs text-muted-foreground">Dispatch Hub</p><p className="mt-1 truncate font-semibold">{market.hubName || market.hub?.name || "Not assigned"}</p></div><div><p className="text-xs text-muted-foreground">Market ID</p><p className="mt-1 font-mono text-xs font-semibold">{market.publicId || market.id}</p></div></div></div>
            </div>
          </Card>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <div className="space-y-4">
              <DetailSection title="Operational context" description="The geography and dispatch relationships used by Hook operations."><DefinitionGrid columns={2} items={[{ label: "Operation State", value: market.stateName || market.state?.name || "Not assigned" }, { label: "Operation City", value: market.cityName || market.city?.name || "Not assigned" }, { label: "Service Zone", value: market.zoneName || market.zone?.name || "Not assigned" }, { label: "Dispatch Hub", value: market.hubName || market.hub?.name || "Not assigned" }, { label: "Address", value: market.address, span: 2 }, { label: "Coordinates", value: market.coordinates?.lat !== undefined && market.coordinates?.lng !== undefined ? `${market.coordinates.lat}, ${market.coordinates.lng}` : "Not recorded" }]} /></DetailSection>
              <DetailSection title="Market notes" description="Internal context for the operations team."><p className="text-sm leading-6 text-muted-foreground">{market.notes || "No internal notes have been added for this market."}</p></DetailSection>
            </div>
            <div className="space-y-4">
              <Card className="rounded-xl shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4 text-[#b18b00]" /> Dispatch readiness</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Navigation className="size-4" /></span><div><p className="font-medium">{market.hubName || market.hub?.name ? "Connected to a Dispatch Hub" : "Awaiting Hub assignment"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{market.hubName || market.hub?.name || "Assign a compatible Hub before this market is used for fulfilment operations."}</p></div></div><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700"><Clock3 className="size-4" /></span><div><p className="font-medium">Record activity</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Updated {dateLabel(market.updatedAt)}</p></div></div></CardContent></Card>
              <Card className="rounded-xl bg-[#fffdf3] shadow-none"><CardContent className="flex items-start gap-3 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff0a8] text-[#876800]"><Store className="size-4" /></span><div><p className="text-sm font-semibold">Image-led market identity</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use this workspace to keep the market image, operating location, and dispatch relationship consistent across Hook operations.</p></div></CardContent></Card>
            </div>
          </div>
        </> : null}
      </QueryState>
      {market ? <MarketFormDialog key={`${market.publicId || market.id}-${editing ? "open" : "closed"}`} open={editing} market={market} onClose={() => setEditing(false)} onSuccess={() => void query.refetch()} /> : null}
      <Dialog open={lifecycleOpen} onOpenChange={(next) => { if (!next && !acting) { setLifecycleOpen(false); setReason(""); } }}><DialogContent><DialogHeader><DialogTitle>{market?.status === "active" ? "Deactivate market?" : "Activate market?"}</DialogTitle><DialogDescription>This reversible change is recorded in the audit log and affects future operational use.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="market-detail-reason">Audit reason</Label><Input id="market-detail-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a clear operational reason" minLength={3} maxLength={500} /></div><DialogFooter><Button variant="outline" disabled={acting} onClick={() => setLifecycleOpen(false)}>Cancel</Button><Button variant={market?.status === "active" ? "destructive" : "brand"} disabled={acting || reason.trim().length < 3} onClick={() => void changeLifecycle()}>{acting ? <HookLoader size="button" /> : market?.status === "active" ? "Deactivate" : "Activate"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
