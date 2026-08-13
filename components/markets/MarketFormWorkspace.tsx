"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, MapPin, Save, Store } from "lucide-react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiPatch, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { MarketImage } from "./MarketImage";
import type { CollectionResponse, LookupRecord, MarketRecord } from "./market-types";
import { relationIdentifier } from "./market-types";

function options(data?: CollectionResponse<LookupRecord>) {
  return (data?.data || [])
    .map((item) => ({ value: String(item.publicId || item.id || ""), label: item.name }))
    .filter((item) => item.value);
}

function initialForm(market?: MarketRecord | null) {
  return {
    name: market?.name || "",
    stateId: relationIdentifier(market, "state"),
    cityId: relationIdentifier(market, "city"),
    hubId: relationIdentifier(market, "hub"),
    address: market?.address || "",
    imageUrl: market?.imageUrl || "",
    shortDisplayName: market?.shortDisplayName || "",
    discoveryColor: market?.discoveryColor || "#FF8A62",
    isFeatured: Boolean(market?.isFeatured),
    displayPriority: String(market?.displayPriority ?? 100),
    notes: market?.notes || "",
    status: market?.status || "inactive",
    reason: "",
  };
}

function FieldSection({ icon: Icon, title, description, children }: { icon: typeof Store; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl shadow-none">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-5 flex items-start gap-3 border-b pb-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fff5bd] text-[#715800]"><Icon className="size-4" /></span>
          <div><h2 className="text-sm font-semibold text-foreground">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      </CardContent>
    </Card>
  );
}

export function MarketFormWorkspace({ mode }: { mode: "create" | "edit" }) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const marketId = mode === "edit" ? String(params.id || "") : "";
  const marketQuery = useApiQuery<MarketRecord>(["admin", "market", marketId], `/admin/markets/${marketId}`, mode === "edit" && Boolean(marketId));
  const market = mode === "edit" ? marketQuery.data : null;
  const [draft, setDraft] = useState<ReturnType<typeof initialForm> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const form = draft || initialForm(market);
  const states = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "states"], "/admin/states?limit=100");
  const cities = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "cities", form.stateId], `/admin/cities?limit=100&stateId=${encodeURIComponent(form.stateId)}`, Boolean(form.stateId));
  const hubs = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "hubs", form.stateId], `/admin/hubs?limit=100&stateId=${encodeURIComponent(form.stateId)}`, Boolean(form.stateId));
  const stateOptions = useMemo(() => (states.data?.data || []).filter((item) => item.operationsEnabled || String(item.publicId || item.id) === form.stateId).map((item) => ({ value: String(item.publicId || item.id), label: item.name })), [form.stateId, states.data]);
  const cityOptions = useMemo(() => options(cities.data), [cities.data]);
  const hubOptions = useMemo(() => options(hubs.data), [hubs.data]);
  const selectedState = stateOptions.find((item) => item.value === form.stateId)?.label;
  const selectedCity = cityOptions.find((item) => item.value === form.cityId)?.label;
  const selectedHub = hubOptions.find((item) => item.value === form.hubId)?.label;
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setDraft((current) => ({ ...(current || form), [key]: value }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Enter a clear market name.");
    if (!form.stateId) return setFormError("Select an Operating State.");
    if (!form.cityId) return setFormError("Select the city where this market operates.");
    if (form.address.trim().length < 5) return setFormError("Enter the complete operating address.");
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(), stateId: form.stateId, cityId: form.cityId,
        hubId: form.hubId || undefined, address: form.address.trim(), imageUrl: form.imageUrl.trim() || undefined,
        shortDisplayName: form.shortDisplayName.trim() || undefined, discoveryColor: form.discoveryColor,
        isFeatured: form.isFeatured, displayPriority: Number(form.displayPriority || 100),
        notes: form.notes.trim() || undefined, status: form.status,
        ...(mode === "edit" && form.reason.trim() ? { reason: form.reason.trim() } : {}),
      };
      if (mode === "edit") await apiPatch(`/admin/markets/${marketId}`, body);
      else await apiPost("/admin/markets", body);
      toast.success(mode === "edit" ? "Market updated" : "Market created");
      router.push(mode === "edit" ? `/dashboard/markets/${marketId}` : "/dashboard/markets");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to save market";
      setFormError(message); toast.error(message);
    } finally { setSaving(false); }
  }

  if (mode === "edit" && marketQuery.isLoading) return <div className="grid min-h-[70vh] place-items-center"><HookLoader label="Loading market editor" /></div>;

  return (
    <PermissionGuard permission="markets.manage" fallback={<div className="p-6 text-sm text-muted-foreground">You do not have permission to manage Markets.</div>}>
      <QueryState error={mode === "edit" ? marketQuery.error : undefined} errorTitle="Market editor unavailable" onRetry={() => marketQuery.refetch()}>
        <form onSubmit={save} className="min-h-full bg-muted/20">
          <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Button asChild type="button" variant="outline" size="icon"><Link href={mode === "edit" ? `/dashboard/markets/${marketId}` : "/dashboard/markets"} aria-label="Back to Markets"><ArrowLeft /></Link></Button>
                <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Market operations</p><h1 className="truncate text-lg font-semibold">{mode === "edit" ? `Edit ${market?.name || "market"}` : "Create market"}</h1></div>
              </div>
              <div className="flex items-center gap-2"><Button asChild type="button" variant="outline" className="flex-1 sm:flex-none"><Link href={mode === "edit" ? `/dashboard/markets/${marketId}` : "/dashboard/markets"}>Cancel</Link></Button><Button type="submit" variant="brand" disabled={saving} className="flex-1 sm:flex-none">{saving ? <HookLoader size="button" /> : <><Save />{mode === "edit" ? "Save changes" : "Create market"}</>}</Button></div>
            </div>
          </div>

          <div className="grid w-full gap-5 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {formError ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
              <FieldSection icon={Store} title="Market identity" description="Set the official operating name and the shorter name customers see in Hook-App.">
                <div className="space-y-1.5"><Label htmlFor="market-name">Market name</Label><Input id="market-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Balogun Market" required /></div>
                <div className="space-y-1.5"><Label htmlFor="market-short">Mobile display name</Label><Input id="market-short" value={form.shortDisplayName} onChange={(e) => set("shortDisplayName", e.target.value)} placeholder="Balogun" maxLength={60} /></div>
              </FieldSection>
              <FieldSection icon={MapPin} title="Operating location" description="Connect this market to an enabled Operating State, city, and compatible Dispatch Hub.">
                <div className="space-y-1.5"><Label>Operating State</Label><Select value={form.stateId} onValueChange={(value) => setDraft({ ...form, stateId: value, cityId: "", hubId: "" })}><SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger><SelectContent>{stateOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>City</Label><Select value={form.cityId} onValueChange={(value) => set("cityId", value)} disabled={!form.stateId || cities.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder={form.stateId ? "Select city" : "Select State first"} /></SelectTrigger><SelectContent>{cityOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Dispatch Hub <span className="font-normal text-muted-foreground">(optional)</span></Label><Select value={form.hubId || "none"} onValueChange={(value) => set("hubId", value === "none" ? "" : value)} disabled={!form.stateId || hubs.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder="Select Hub" /></SelectTrigger><SelectContent><SelectItem value="none">Assign later</SelectItem>{hubOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-address">Operating address</Label><Input id="market-address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full market address" required /></div>
              </FieldSection>
              <FieldSection icon={ImageIcon} title="Customer discovery" description="Control the image, colour, priority, and Home placement shown to customers.">
                <div className="sm:col-span-2"><MediaPicker maxFiles={1} uploadPath="/admin/uploads/images" value={form.imageUrl ? [form.imageUrl] : []} onChange={(urls) => set("imageUrl", urls[0] || "")} label="Market image" description="Upload one clear landscape image or import one from a public URL." /></div>
                <div className="space-y-1.5"><Label htmlFor="market-priority">Display priority</Label><Input id="market-priority" type="number" min={0} max={10000} value={form.displayPriority} onChange={(e) => set("displayPriority", e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="market-color">Discovery colour</Label><div className="flex gap-2"><Input id="market-color" type="color" value={form.discoveryColor} onChange={(e) => set("discoveryColor", e.target.value)} className="w-14 px-1" /><Input value={form.discoveryColor} onChange={(e) => set("discoveryColor", e.target.value.toUpperCase())} pattern="#[0-9A-Fa-f]{6}" /></div></div>
                <div className="flex min-h-16 items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 sm:col-span-2"><div><Label htmlFor="market-featured" className="cursor-pointer text-sm font-semibold">Feature on Home</Label><p className="mt-1 text-xs leading-5 text-muted-foreground">Give this market priority in customer discovery.</p></div><Switch id="market-featured" checked={form.isFeatured} onCheckedChange={(checked) => set("isFeatured", checked)} className="data-checked:bg-[#FFC809]" aria-label="Feature this market on Home" /></div>
              </FieldSection>
              <FieldSection icon={Save} title="Status and internal context" description="Control operational availability and leave concise context for the Hook team.">
                <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="market-notes">Internal notes</Label><Input id="market-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional operations note" /></div>
                {mode === "edit" ? <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-reason">Audit reason <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="market-reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Why is this market being changed?" maxLength={500} /></div> : null}
              </FieldSection>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <Card className="overflow-hidden rounded-xl shadow-none"><div className="relative aspect-[16/10] max-h-64 bg-muted"><MarketImage src={form.imageUrl} alt={form.name || "Market preview"} className="size-full" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12"><StatusBadge status={form.status} /><h2 className="mt-2 text-xl font-semibold text-white">{form.shortDisplayName || form.name || "Market name"}</h2><p className="mt-1 text-xs text-white/80">{[selectedCity, selectedState].filter(Boolean).join(", ") || "Operating location"}</p></div></div><CardContent className="space-y-3 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operational preview</p><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Dispatch Hub</span><span className="text-right font-medium">{selectedHub || "Assign later"}</span></div><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Home placement</span><span className="text-right font-medium">{form.isFeatured ? "Featured" : "Standard"}</span></div><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Priority</span><span className="font-medium tabular-nums">{form.displayPriority}</span></div></CardContent></Card>
              <p className="px-1 text-xs leading-5 text-muted-foreground">Customer-facing changes appear in Hook-App after the market is saved. Backend validation remains authoritative.</p>
            </aside>
          </div>
        </form>
      </QueryState>
    </PermissionGuard>
  );
}
