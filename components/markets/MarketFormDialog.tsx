"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { useApiQuery } from "@/lib/query";
import { apiPatch, apiPost } from "@/lib/api";
import { MarketImage } from "./MarketImage";
import type { CollectionResponse, LookupRecord, MarketRecord } from "./market-types";
import { relationIdentifier } from "./market-types";

function lookupOptions(data?: CollectionResponse<LookupRecord>) {
  return (data?.data || []).map((item) => ({ value: String(item.publicId || item.id || ""), label: item.name })).filter((item) => item.value);
}

function emptyToUndefined(value: string) {
  return value.trim() || undefined;
}

function initialForm(market: MarketRecord | null) {
  return {
    name: market?.name || "",
    stateId: relationIdentifier(market, "state"),
    cityId: relationIdentifier(market, "city"),
    zoneId: relationIdentifier(market, "zone"),
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

export function MarketFormDialog({
  open,
  market,
  onClose,
  onSuccess,
}: {
  open: boolean;
  market: MarketRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() => initialForm(market));
  const [saving, setSaving] = useState(false);
  const states = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "states"], "/admin/states?limit=100", open);
  const cities = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "cities", form.stateId], `/admin/cities?limit=100&stateId=${encodeURIComponent(form.stateId)}`, open && Boolean(form.stateId));
  const zones = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "zones", form.stateId, form.cityId], `/admin/zones?limit=100&stateId=${encodeURIComponent(form.stateId)}&cityId=${encodeURIComponent(form.cityId)}`, open && Boolean(form.stateId && form.cityId));
  const hubs = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "hubs", form.stateId], `/admin/hubs?limit=100&stateId=${encodeURIComponent(form.stateId)}`, open && Boolean(form.stateId));

  const stateOptions = useMemo(() => lookupOptions(states.data), [states.data]);
  const cityOptions = useMemo(() => lookupOptions(cities.data), [cities.data]);
  const zoneOptions = useMemo(() => lookupOptions(zones.data), [zones.data]);
  const hubOptions = useMemo(() => lookupOptions(hubs.data), [hubs.data]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.stateId || !form.cityId || form.address.trim().length < 5) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        stateId: form.stateId,
        cityId: form.cityId,
        zoneId: emptyToUndefined(form.zoneId),
        hubId: emptyToUndefined(form.hubId),
        address: form.address.trim(),
        imageUrl: emptyToUndefined(form.imageUrl),
        shortDisplayName: emptyToUndefined(form.shortDisplayName),
        discoveryColor: form.discoveryColor,
        isFeatured: form.isFeatured,
        displayPriority: Number(form.displayPriority || 100),
        notes: emptyToUndefined(form.notes),
        status: form.status,
        ...(market && form.reason.trim() ? { reason: form.reason.trim() } : {}),
      };
      if (market) {
        await apiPatch(`/admin/markets/${market.publicId || market.id}`, body);
        toast.success("Market updated");
      } else {
        await apiPost("/admin/markets", body);
        toast.success("Market created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to save market");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{market ? "Edit market" : "Add market"}</DialogTitle>
          <DialogDescription>Keep the market identity, operating geography, and discovery image accurate for Hook teams.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-name">Market name</Label><Input id="market-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Balogun Market" required /></div>
          <div className="space-y-1.5"><Label>Operation state</Label><Select value={form.stateId} onValueChange={(value) => setForm((current) => ({ ...current, stateId: value, cityId: "", zoneId: "", hubId: "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select state" /></SelectTrigger><SelectContent>{stateOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Operation city</Label><Select value={form.cityId} onValueChange={(value) => setForm((current) => ({ ...current, cityId: value, zoneId: "" }))} disabled={!form.stateId || cities.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder={form.stateId ? "Select city" : "Select state first"} /></SelectTrigger><SelectContent>{cityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Service zone <span className="font-normal text-muted-foreground">(optional)</span></Label><Select value={form.zoneId || "none"} onValueChange={(value) => update("zoneId", value === "none" ? "" : value)} disabled={!form.cityId || zones.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder="Select zone" /></SelectTrigger><SelectContent><SelectItem value="none">No zone assigned</SelectItem>{zoneOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Dispatch Hub <span className="font-normal text-muted-foreground">(optional)</span></Label><Select value={form.hubId || "none"} onValueChange={(value) => update("hubId", value === "none" ? "" : value)} disabled={!form.stateId || hubs.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder="Select hub" /></SelectTrigger><SelectContent><SelectItem value="none">No hub assigned</SelectItem>{hubOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-address">Address</Label><Input id="market-address" value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Full market address" required /></div>
          <div className="sm:col-span-2"><MediaPicker value={form.imageUrl ? [form.imageUrl] : []} onChange={(urls) => update("imageUrl", urls[0] || "")} label="Market discovery image" description="Upload one clear landscape market image. It is used on Home and the Market storefront." /></div>
          <div className="space-y-1.5"><Label htmlFor="market-short-name">Mobile display name</Label><Input id="market-short-name" value={form.shortDisplayName} onChange={(event) => update("shortDisplayName", event.target.value)} placeholder="Balogun Market" maxLength={60} /></div>
          <div className="space-y-1.5"><Label htmlFor="market-priority">Display priority</Label><Input id="market-priority" type="number" min={0} max={10000} value={form.displayPriority} onChange={(event) => update("displayPriority", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="market-color">Discovery colour</Label><div className="flex gap-2"><Input id="market-color" type="color" value={form.discoveryColor} onChange={(event) => update("discoveryColor", event.target.value)} className="w-14 px-1" /><Input value={form.discoveryColor} onChange={(event) => update("discoveryColor", event.target.value.toUpperCase())} pattern="#[0-9A-Fa-f]{6}" /></div></div>
          <div className="space-y-1.5"><Label>Home placement</Label><button type="button" onClick={() => setForm((current) => ({ ...current, isFeatured: !current.isFeatured }))} className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm font-medium ${form.isFeatured ? "border-[#d7a900] bg-[#fff8d7]" : "border-input bg-background"}`}><span>Feature this market</span><span className={`size-3 rounded-full ${form.isFeatured ? "bg-[#FFC809]" : "bg-zinc-300"}`} /></button></div>
          <div className="sm:col-span-2 rounded-lg border bg-zinc-50 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile preview</p><div className="flex min-h-24 items-center justify-between overflow-hidden rounded-lg px-5" style={{ backgroundColor: form.discoveryColor }}><div><span className="rounded-full bg-[#FFC809] px-2 py-1 text-[10px] font-bold text-black">{form.isFeatured ? "Popular" : "Market"}</span><p className="mt-2 whitespace-pre-line text-lg font-black leading-5 text-white">{form.shortDisplayName || form.name || "Market name"}</p></div><MarketImage src={form.imageUrl} alt={form.name || "Market"} className="size-20 rounded-full border-4 border-white/70" iconOnly /></div></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update("status", value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="market-notes">Internal notes</Label><Input id="market-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Optional operations note" /></div>
          {market ? <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-reason">Audit reason <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="market-reason" value={form.reason} onChange={(event) => update("reason", event.target.value)} placeholder="Why is this market being changed?" maxLength={500} /></div> : null}
          <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" variant="brand" disabled={saving || !form.name.trim() || !form.stateId || !form.cityId || form.address.trim().length < 5}>{saving ? <HookLoader size="button" /> : market ? "Save changes" : "Create market"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
