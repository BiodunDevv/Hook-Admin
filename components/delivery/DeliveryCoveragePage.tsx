"use client";

import { useState } from "react";
import { Check, Database, Loader2, MapPin, Plus, Save, SlidersHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPatch, apiPost } from "@/lib/api";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";

type StateRow = {
  publicId: string;
  name: string;
  capitalName?: string;
  code: string;
  status: string;
  deliveryEnabled: boolean;
  lgaCount?: number;
};

type Rule = {
  publicId: string;
  name: string;
  scope: "global" | "state" | "zone";
  scopeId?: string;
  mode: "flat" | "per_km" | "distance_bands";
  flatFeeMinor?: number;
  baseFeeMinor?: number;
  feePerKmMinor?: number;
  fallbackFeeMinor?: number;
  originHubId?: string;
  bands?: Array<{ upToKm: number; feeMinor: number }>;
  status: "active" | "inactive";
  version: number;
};

type DeliverySettings = {
  defaultDeliveryFeeMinor?: number;
};

type DeliveryQueryData = {
  settings: DeliverySettings;
  states: StateRow[];
  rules: Rule[];
};

type DirectoryRow = {
  publicId?: string;
  id?: string;
  name: string;
};

type PreviewResult = {
  scope: Rule["scope"];
  mode: Rule["mode"];
  distanceKm?: number;
  billableKm?: number;
  baseFeeMinor?: number;
  feePerKmMinor?: number;
  feeMinor: number;
  ruleVersion: string;
};

function money(value: number | undefined) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0) / 100);
}

function listOf<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.items)) return record.items as T[];
  }
  return [];
}

function directoryId(row: DirectoryRow) {
  return row.publicId || row.id;
}

export function DeliveryCoveragePage() {
  const session = useAdminSession();
  const queryClient = useQueryClient();
  const canManageCoverage = hasPermission(session.data, "delivery.coverage.manage");
  const canManagePricing = hasPermission(session.data, "delivery.pricing.manage");
  const canPreview = hasPermission(session.data, "delivery.pricing.preview");
  const query = useApiQuery<DeliveryQueryData>(["admin", "delivery"], "/admin/delivery");
  const zonesQuery = useApiQuery<unknown>(["admin", "delivery", "zones"], "/admin/zones?limit=100");
  const hubsQuery = useApiQuery<unknown>(["admin", "delivery", "hubs"], "/admin/hubs?limit=100");
  const [defaultFeeDraft, setDefaultFeeDraft] = useState<string>();
  const [form, setForm] = useState({
    name: "",
    scope: "global" as Rule["scope"],
    scopeId: "",
    mode: "per_km" as Rule["mode"],
    flatFee: "3000",
    baseFee: "1500",
    feePerKm: "150",
    fallbackFee: "3000",
    originHubId: "none",
    bands: "10:2500,25:3000,60:4000",
  });
  const [previewStateId, setPreviewStateId] = useState("");
  const [previewZoneId, setPreviewZoneId] = useState("none");
  const [previewLatitude, setPreviewLatitude] = useState("6.5244");
  const [previewLongitude, setPreviewLongitude] = useState("3.3792");
  const [previewResult, setPreviewResult] = useState<PreviewResult>();
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);

  const states = query.data?.states || [];
  const rules = query.data?.rules || [];
  const zones = listOf<DirectoryRow>(zonesQuery.data);
  const hubs = listOf<DirectoryRow>(hubsQuery.data);
  const defaultFee = defaultFeeDraft ?? String(Number(query.data?.settings?.defaultDeliveryFeeMinor ?? 300000) / 100);
  const selectedPreviewStateId = previewStateId || states.find((state) => state.deliveryEnabled)?.publicId || "";
  const scopeRows: DirectoryRow[] = form.scope === "state" ? states : zones;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "delivery"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "delivery", "zones"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "delivery", "hubs"] }),
    ]);
  }

  async function toggleState(state: StateRow, enabled: boolean) {
    try {
      await apiPatch(`/admin/delivery/states/${state.publicId}`, { deliveryEnabled: enabled, reason: enabled ? "Enabled customer delivery coverage" : "Paused customer delivery coverage" });
      toast.success(`${state.name} delivery ${enabled ? "enabled" : "paused"}`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update delivery coverage");
    }
  }

  async function saveDefaultFee() {
    const naira = Number(defaultFee);
    if (!Number.isFinite(naira) || naira < 0) return toast.error("Enter a valid delivery fallback");
    try {
      await apiPatch("/admin/delivery/settings", { defaultDeliveryFeeMinor: Math.round(naira * 100), reason: "Updated global delivery fallback" });
      toast.success("Global delivery fallback updated");
      setDefaultFeeDraft(undefined);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the delivery fee");
    }
  }

  async function refreshCatalog() {
    setRefreshingCatalog(true);
    try {
      const result = await apiPost<{ total: number }>("/admin/delivery/locations/refresh", { reason: "Refreshed Nigerian State and LGA catalog" });
      toast.success(`Location catalog refreshed: ${result.total} active LGAs`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh the location catalog");
    } finally {
      setRefreshingCatalog(false);
    }
  }

  async function createRule() {
    if (!form.name.trim()) return toast.error("Name the pricing rule first");
    const flatFee = Number(form.flatFee);
    const baseFee = Number(form.baseFee);
    const feePerKm = Number(form.feePerKm);
    const fallbackFee = Number(form.fallbackFee);
    const bands = form.bands.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
      const [distance, amount] = item.split(":").map(Number);
      return { upToKm: distance, feeMinor: Math.round(amount * 100) };
    });
    if (form.mode === "flat" && (!Number.isFinite(flatFee) || flatFee < 0)) return toast.error("Enter a valid flat fee");
    if (form.mode === "per_km" && [baseFee, feePerKm, fallbackFee].some((value) => !Number.isFinite(value) || value < 0)) return toast.error("Enter a valid base fee, kilometer rate, and fallback");
    if (form.mode === "distance_bands" && bands.some((band) => !Number.isFinite(band.upToKm) || !Number.isFinite(band.feeMinor) || band.upToKm <= 0)) return toast.error("Use distance bands like 10:2500,25:3000");
    try {
      await apiPost("/admin/delivery/rules", {
        name: form.name.trim(),
        scope: form.scope,
        scopeId: form.scope === "global" ? undefined : form.scopeId,
        mode: form.mode,
        flatFeeMinor: form.mode === "flat" ? Math.round(flatFee * 100) : undefined,
        baseFeeMinor: form.mode === "per_km" ? Math.round(baseFee * 100) : undefined,
        feePerKmMinor: form.mode === "per_km" ? Math.round(feePerKm * 100) : undefined,
        fallbackFeeMinor: form.mode === "per_km" ? Math.round(fallbackFee * 100) : undefined,
        originHubId: form.originHubId === "none" ? undefined : form.originHubId,
        bands: form.mode === "distance_bands" ? bands : [],
        status: "active",
        reason: "Created delivery pricing rule",
      });
      toast.success("Delivery pricing rule created");
      setForm((current) => ({ ...current, name: "" }));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create pricing rule");
    }
  }

  async function toggleRule(rule: Rule) {
    try {
      await apiPatch(`/admin/delivery/rules/${rule.publicId}`, { status: rule.status === "active" ? "inactive" : "active", reason: "Updated delivery pricing rule status" });
      toast.success("Pricing rule status updated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update pricing rule");
    }
  }

  async function previewFee() {
    if (!selectedPreviewStateId) return toast.error("Choose a State for the preview");
    const latitude = Number(previewLatitude);
    const longitude = Number(previewLongitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return toast.error("Enter valid destination coordinates");
    try {
      setPreviewResult(await apiPost<PreviewResult>("/admin/delivery/preview", { stateId: selectedPreviewStateId, zoneId: previewZoneId === "none" ? undefined : previewZoneId, coordinates: { latitude, longitude } }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not calculate delivery fee");
    }
  }

  if (!hasPermission(session.data, "delivery.coverage.view")) return <QueryState empty emptyTitle="Delivery settings unavailable" emptyDescription="Your account does not have access to delivery coverage." />;
  if (query.isLoading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="animate-spin text-brand-gold" /></div>;
  if (query.isError) return <QueryState error={query.error} errorTitle="Delivery settings could not load" onRetry={() => void query.refetch()} />;

  return (
    <div className="space-y-5 p-2 md:p-4">
      <PageHeader title="Delivery Coverage & Fees" description="Manage nationwide delivery coverage and the pricing customers see at checkout. Markets remain product-source locations." />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-xs">
        <div><p className="font-semibold">Nigerian location catalog</p><p className="text-sm text-muted-foreground">States, capitals, and LGAs are cached in Hook for fast mobile selection.</p></div>
        <Button variant="outline" disabled={!canManageCoverage || refreshingCatalog} onClick={() => void refreshCatalog()}>{refreshingCatalog ? <Loader2 className="animate-spin" /> : <Database size={16} />} Refresh locations</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="shadow-none">
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><MapPin size={18} /> All Nigerian delivery states <Badge variant="outline">{states.length}</Badge></CardTitle></CardHeader>
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {states.map((state) => <div key={state.publicId} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{state.name}</p><p className="truncate text-xs text-muted-foreground">{state.capitalName || "Capital pending"} · {state.lgaCount || 0} LGAs</p><p className="mt-1 text-[11px] text-muted-foreground">{state.deliveryEnabled ? "Available for delivery" : "Paused by Admin"}</p></div>
              <Switch checked={state.deliveryEnabled} disabled={!canManageCoverage} onCheckedChange={(checked) => void toggleState(state, checked)} aria-label={`Toggle delivery in ${state.name}`} />
            </div>)}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="border-b"><CardTitle>Global fallback</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-4"><p className="text-sm text-muted-foreground">Used when no active State or Zone rule can calculate a route.</p><div className="space-y-2"><Label htmlFor="global-fee">Fallback fee (NGN)</Label><Input id="global-fee" inputMode="decimal" value={defaultFee} onChange={(event) => setDefaultFeeDraft(event.target.value)} disabled={!canManagePricing} /></div><Button className="w-full" variant="brand" disabled={!canManagePricing} onClick={() => void saveDefaultFee()}><Save size={16} /> Save fallback</Button><div className="rounded-lg bg-hook/10 p-3 text-sm"><span className="font-semibold">Current:</span> {money(Number(query.data?.settings?.defaultDeliveryFeeMinor || 0))}</div></CardContent>
        </Card>
      </div>

      {canPreview ? <Card className="shadow-none"><CardHeader className="border-b"><CardTitle>Delivery fee preview</CardTitle></CardHeader><CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5"><div className="space-y-2"><Label>State</Label><Select value={selectedPreviewStateId} onValueChange={setPreviewStateId}><SelectTrigger><SelectValue placeholder="Choose State" /></SelectTrigger><SelectContent>{states.filter((state) => state.deliveryEnabled).map((state) => <SelectItem key={state.publicId} value={state.publicId}>{state.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Service Zone</Label><Select value={previewZoneId} onValueChange={setPreviewZoneId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">State / global rule</SelectItem>{zones.map((zone) => <SelectItem key={zone.publicId || zone.id} value={zone.publicId || zone.id || "unknown"}>{zone.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Latitude</Label><Input value={previewLatitude} inputMode="decimal" onChange={(event) => setPreviewLatitude(event.target.value)} /></div><div className="space-y-2"><Label>Longitude</Label><Input value={previewLongitude} inputMode="decimal" onChange={(event) => setPreviewLongitude(event.target.value)} /></div><div className="flex items-end"><Button className="w-full" variant="brand" onClick={() => void previewFee()}><MapPin size={16} /> Calculate</Button></div>{previewResult ? <div className="rounded-lg bg-hook/10 p-3 text-sm md:col-span-2 xl:col-span-5"><span className="font-semibold">Estimated fee:</span> {money(previewResult.feeMinor)} · {previewResult.scope} · {String(previewResult.mode).replace("_", " ")}{previewResult.distanceKm != null ? ` · ${previewResult.distanceKm} km (${previewResult.billableKm || Math.ceil(previewResult.distanceKm)} billable)` : " · fallback applied"}{previewResult.baseFeeMinor != null ? ` · base ${money(previewResult.baseFeeMinor)} + ${money(previewResult.feePerKmMinor)}/km` : ""} · {previewResult.ruleVersion}</div> : null}</CardContent></Card> : null}

      <Card className="shadow-none"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><SlidersHorizontal size={18} /> Pricing rules</CardTitle></CardHeader><CardContent className="space-y-5 p-4">{canManagePricing ? <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-6"><div className="space-y-2 xl:col-span-2"><Label>Rule name</Label><Input value={form.name} placeholder="Nationwide per-kilometer delivery" onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="space-y-2"><Label>Scope</Label><Select value={form.scope} onValueChange={(value: Rule["scope"]) => setForm({ ...form, scope: value, scopeId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="global">Global</SelectItem><SelectItem value="state">State</SelectItem><SelectItem value="zone">Service Zone</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Scope target</Label><Select value={form.scopeId || "none"} onValueChange={(value) => setForm({ ...form, scopeId: value === "none" ? "" : value })} disabled={form.scope === "global"}><SelectTrigger><SelectValue placeholder={form.scope === "global" ? "Not needed" : "Choose target"} /></SelectTrigger><SelectContent><SelectItem value="none">Not needed</SelectItem>{scopeRows.map((row) => { const id = directoryId(row); return id ? <SelectItem key={id} value={id}>{row.name}</SelectItem> : null; })}</SelectContent></Select></div><div className="space-y-2"><Label>Mode</Label><Select value={form.mode} onValueChange={(value: Rule["mode"]) => setForm({ ...form, mode: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per_km">Base + per km</SelectItem><SelectItem value="flat">Flat fee</SelectItem><SelectItem value="distance_bands">Distance bands</SelectItem></SelectContent></Select></div>{form.mode === "flat" ? <div className="space-y-2"><Label>Fee (NGN)</Label><Input inputMode="decimal" value={form.flatFee} onChange={(event) => setForm({ ...form, flatFee: event.target.value })} /></div> : null}{form.mode === "per_km" ? <><div className="space-y-2"><Label>Base fee (NGN)</Label><Input inputMode="decimal" value={form.baseFee} onChange={(event) => setForm({ ...form, baseFee: event.target.value })} /></div><div className="space-y-2"><Label>Rate per km (NGN)</Label><Input inputMode="decimal" value={form.feePerKm} onChange={(event) => setForm({ ...form, feePerKm: event.target.value })} /></div><div className="space-y-2"><Label>Fallback (NGN)</Label><Input inputMode="decimal" value={form.fallbackFee} onChange={(event) => setForm({ ...form, fallbackFee: event.target.value })} /></div><div className="space-y-2"><Label>Origin Hub</Label><Select value={form.originHubId} onValueChange={(value) => setForm({ ...form, originHubId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Automatic state Hub</SelectItem>{hubs.map((hub) => { const id = directoryId(hub); return id ? <SelectItem key={id} value={id}>{hub.name}</SelectItem> : null; })}</SelectContent></Select></div></> : null}{form.mode === "distance_bands" ? <div className="space-y-2 md:col-span-2 xl:col-span-4"><Label>Distance bands</Label><Input value={form.bands} onChange={(event) => setForm({ ...form, bands: event.target.value })} placeholder="10:2500,25:3000,60:4000" /><p className="text-xs text-muted-foreground">Format: kilometres:fee in NGN, ordered from nearest to farthest.</p></div> : null}<div className="flex items-end"><Button variant="brand" className="w-full" onClick={() => void createRule()}><Plus size={16} /> Add rule</Button></div></div> : null}<div className="divide-y rounded-lg border">{rules.map((rule) => <div key={rule.publicId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{rule.name}</p><Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge><Badge variant="outline">{rule.scope} · {rule.mode.replace("_", " ")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{rule.mode === "per_km" ? `${money(rule.baseFeeMinor)} base + ${money(rule.feePerKmMinor)}/km · fallback ${money(rule.fallbackFeeMinor)}` : rule.mode === "flat" ? money(rule.flatFeeMinor) : `${rule.bands?.length || 0} distance bands`} · v{rule.version}</p></div>{canManagePricing ? <Button size="sm" variant="outline" onClick={() => void toggleRule(rule)}>{rule.status === "active" ? "Pause" : "Activate"}</Button> : null}</div>)}{!rules.length ? <div className="p-8 text-center text-sm text-muted-foreground">No pricing rules configured. The global fallback remains active.</div> : null}</div></CardContent></Card>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Check size={14} className="text-emerald-600" /> Delivery coverage is independent from Market sourcing availability.</div>
    </div>
  );
}
