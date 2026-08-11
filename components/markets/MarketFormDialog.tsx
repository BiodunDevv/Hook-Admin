"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { useApiQuery } from "@/lib/query";
import { apiPatch, apiPost } from "@/lib/api";
import { MarketImage } from "./MarketImage";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
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
  const [formError, setFormError] = useState("");
  const states = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "states"], "/admin/states?limit=100", open);
  const cities = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "cities", form.stateId], `/admin/cities?limit=100&stateId=${encodeURIComponent(form.stateId)}`, open && Boolean(form.stateId));
  const hubs = useApiQuery<CollectionResponse<LookupRecord>>(["markets", "form", "hubs", form.stateId], `/admin/hubs?limit=100&stateId=${encodeURIComponent(form.stateId)}`, open && Boolean(form.stateId));

  const stateOptions = useMemo(() => {
    const selectedState = form.stateId;
    const records = (states.data?.data || []).filter((item) => item.operationsEnabled || item.publicId === selectedState || item.id === selectedState);
    return records.map((item) => ({ value: String(item.publicId || item.id || ""), label: item.name })).filter((item) => item.value);
  }, [form.stateId, states.data]);
  const cityOptions = useMemo(() => lookupOptions(cities.data), [cities.data]);
  const hubOptions = useMemo(() => lookupOptions(hubs.data), [hubs.data]);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Enter a clear market name.");
    if (!form.stateId) return setFormError("Select the Operating State for this market.");
    if (!form.cityId) return setFormError("Select the city where this market operates.");
    if (form.address.trim().length < 5) return setFormError("Enter the market's complete operating address.");
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        stateId: form.stateId,
        cityId: form.cityId,
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
      const message = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to save market";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => { if (!next && !saving) onClose(); }}
      title={market ? "Edit market" : "Add market"}
      description="Update where the Market operates and how customers see it."
      footer={<><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button form="market-form" type="submit" variant="brand" disabled={saving}>{saving ? <HookLoader size="button" /> : market ? "Save changes" : "Create market"}</Button></>}
    >
        <form id="market-form" onSubmit={save} className="space-y-6">
          {formError ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div> : null}
          <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold">Market identity</h3><p className="mt-1 text-xs text-muted-foreground">The official name and customer-facing short name.</p></div>
            <div className="space-y-1.5"><Label htmlFor="market-name">Market name</Label><Input id="market-name" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Balogun Market" required /></div>
            <div className="space-y-1.5"><Label htmlFor="market-short-name">Mobile display name</Label><Input id="market-short-name" value={form.shortDisplayName} onChange={(event) => update("shortDisplayName", event.target.value)} placeholder="Balogun" maxLength={60} /></div>
          </section>
          <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold">Operating location</h3><p className="mt-1 text-xs text-muted-foreground">Only States enabled for Hook operations can host Markets.</p></div>
            <div className="space-y-1.5"><Label>Operating State</Label><Select value={form.stateId} onValueChange={(value) => setForm((current) => ({ ...current, stateId: value, cityId: "", hubId: "" }))}><SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger><SelectContent>{stateOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>City</Label><Select value={form.cityId} onValueChange={(value) => setForm((current) => ({ ...current, cityId: value }))} disabled={!form.stateId || cities.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder={form.stateId ? "Select city" : "Select State first"} /></SelectTrigger><SelectContent>{cityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Dispatch Hub <span className="font-normal text-muted-foreground">(optional)</span></Label><Select value={form.hubId || "none"} onValueChange={(value) => update("hubId", value === "none" ? "" : value)} disabled={!form.stateId || hubs.isLoading}><SelectTrigger className="w-full"><SelectValue placeholder="Select Hub" /></SelectTrigger><SelectContent><SelectItem value="none">Assign later</SelectItem>{hubOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-address">Operating address</Label><Input id="market-address" value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Full market address" required /></div>
          </section>
          <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold">Customer discovery</h3><p className="mt-1 text-xs text-muted-foreground">Control the image, colour, and placement used in Hook-App.</p></div>
            <div className="sm:col-span-2"><MediaPicker uploadPath="/admin/uploads/images" value={form.imageUrl ? [form.imageUrl] : []} onChange={(urls) => update("imageUrl", urls[0] || "")} label="Market discovery image" description="Use one clear landscape image for Home and the Market storefront." /></div>
          <div className="space-y-1.5"><Label htmlFor="market-priority">Display priority</Label><Input id="market-priority" type="number" min={0} max={10000} value={form.displayPriority} onChange={(event) => update("displayPriority", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="market-color">Discovery colour</Label><div className="flex gap-2"><Input id="market-color" type="color" value={form.discoveryColor} onChange={(event) => update("discoveryColor", event.target.value)} className="w-14 px-1" /><Input value={form.discoveryColor} onChange={(event) => update("discoveryColor", event.target.value.toUpperCase())} pattern="#[0-9A-Fa-f]{6}" /></div></div>
          <div className="space-y-1.5"><Label>Home placement</Label><button type="button" onClick={() => setForm((current) => ({ ...current, isFeatured: !current.isFeatured }))} className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm font-medium ${form.isFeatured ? "border-[#d7a900] bg-[#fff8d7]" : "border-input bg-background"}`}><span>Feature this market</span><span className={`size-3 rounded-full ${form.isFeatured ? "bg-[#FFC809]" : "bg-zinc-300"}`} /></button></div>
          <div className="sm:col-span-2 rounded-lg border bg-zinc-50 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile preview</p><div className="flex min-h-24 items-center justify-between overflow-hidden rounded-lg px-5" style={{ backgroundColor: form.discoveryColor }}><div><span className="rounded-full bg-[#FFC809] px-2 py-1 text-[10px] font-bold text-black">{form.isFeatured ? "Popular" : "Market"}</span><p className="mt-2 whitespace-pre-line text-lg font-black leading-5 text-white">{form.shortDisplayName || form.name || "Market name"}</p></div><MarketImage src={form.imageUrl} alt={form.name || "Market"} className="size-20 rounded-full border-4 border-white/70" iconOnly /></div></div>
          </section>
          <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold">Status and internal context</h3><p className="mt-1 text-xs text-muted-foreground">Manage visibility and leave concise notes for Operations.</p></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update("status", value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="market-notes">Internal notes</Label><Input id="market-notes" value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Optional operations note" /></div>
          {market ? <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="market-reason">Audit reason <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="market-reason" value={form.reason} onChange={(event) => update("reason", event.target.value)} placeholder="Why is this market being changed?" maxLength={500} /></div> : null}
          </section>
        </form>
    </AdminWorkflowSheet>
  );
}
