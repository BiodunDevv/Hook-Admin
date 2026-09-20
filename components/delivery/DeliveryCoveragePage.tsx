"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeDollarSign, CheckCircle2, Clock3, Database, Loader2, MapPin, RefreshCw, Save, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { QueryState } from "@/components/shared/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiPatch, apiPost } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { REGION_DEFAULT_FEE_MINOR, REGION_LABEL, regionOf, type DeliveryRegion } from "@/lib/nigeria-regions";

type StateRow = {
  publicId: string;
  name: string;
  capitalName?: string;
  code: string;
  status: string;
  deliveryEnabled: boolean;
  deliveryFeeMinor?: number;
  lgaCount?: number;
};

type DeliveryQueryData = { states: StateRow[] };
type Filter = "all" | DeliveryRegion | "unpriced";

const naira = (minor?: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(minor || 0) / 100);

const cleanError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;

/**
 * Delivery States: coverage and the customer's delivery price, per State. The
 * price the customer pays at checkout is the price of the State in their
 * address, so it lives here and nowhere else.
 */
export function DeliveryCoveragePage() {
  const session = useAdminSession();
  const queryClient = useQueryClient();
  const canManageCoverage = hasPermission(session.data, "delivery.coverage.manage");
  const canManagePricing = hasPermission(session.data, "delivery.pricing.manage");
  const query = useApiQuery<DeliveryQueryData>(["admin", "delivery"], "/admin/delivery");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string>();
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const [confirmDefaults, setConfirmDefaults] = useState(false);
  const [applying, setApplying] = useState(false);

  const states = useMemo(() => query.data?.states || [], [query.data?.states]);
  const priced = states.filter((state) => state.deliveryFeeMinor !== undefined && state.deliveryFeeMinor !== null);
  const fees = priced.map((state) => Number(state.deliveryFeeMinor));
  const average = fees.length ? Math.round(fees.reduce((sum, fee) => sum + fee, 0) / fees.length) : 0;
  const enabled = states.filter((state) => state.deliveryEnabled).length;
  const unpriced = states.length - priced.length;

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: states.length, north: 0, south: 0, east: 0, west: 0, unpriced };
    for (const state of states) {
      const region = regionOf(state.name);
      if (region) result[region] += 1;
    }
    return result;
  }, [states, unpriced]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return states.filter((state) => {
      if (filter === "unpriced" && state.deliveryFeeMinor !== undefined && state.deliveryFeeMinor !== null) return false;
      if (filter !== "all" && filter !== "unpriced" && regionOf(state.name) !== filter) return false;
      return !needle || `${state.name} ${state.capitalName || ""} ${state.code}`.toLowerCase().includes(needle);
    });
  }, [states, search, filter]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "delivery"] });
  }

  async function toggleState(state: StateRow, value: boolean) {
    try {
      await apiPatch(`/admin/delivery/states/${state.publicId}`, {
        deliveryEnabled: value,
        reason: value ? "Enabled customer delivery coverage" : "Paused customer delivery coverage",
      });
      toast.success(`${state.name} delivery ${value ? "enabled" : "paused"}`);
      await refresh();
    } catch (error) {
      toast.error(cleanError(error, "Could not update delivery coverage"));
    }
  }

  async function savePrice(state: StateRow) {
    const value = Number(drafts[state.publicId]);
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter a valid price in naira");
    setSaving(state.publicId);
    try {
      await apiPatch(`/admin/delivery/states/${state.publicId}`, {
        deliveryFeeMinor: Math.round(value * 100),
        reason: "Updated State delivery price",
      });
      toast.success(`${state.name} delivery price set to ${naira(Math.round(value * 100))}`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[state.publicId];
        return next;
      });
      await refresh();
    } catch (error) {
      toast.error(cleanError(error, "Could not save the delivery price"));
    } finally {
      setSaving(undefined);
    }
  }

  // Fill only States that have no price yet, using the regional defaults.
  async function applyRegionalDefaults() {
    setApplying(true);
    let done = 0;
    try {
      for (const state of states) {
        const region = regionOf(state.name);
        if (!region || (state.deliveryFeeMinor !== undefined && state.deliveryFeeMinor !== null)) continue;
        await apiPatch(`/admin/delivery/states/${state.publicId}`, {
          deliveryFeeMinor: REGION_DEFAULT_FEE_MINOR[region],
          reason: `Applied ${REGION_LABEL[region]} regional delivery price`,
        });
        done += 1;
      }
      toast.success(done ? `Priced ${done} State${done === 1 ? "" : "s"} by region` : "Every State already has a price");
      setConfirmDefaults(false);
      await refresh();
    } catch (error) {
      toast.error(cleanError(error, "Could not apply regional prices"));
    } finally {
      setApplying(false);
    }
  }

  async function refreshCatalog() {
    setRefreshingCatalog(true);
    try {
      const result = await apiPost<{ total: number }>("/admin/delivery/locations/refresh", { reason: "Refreshed Nigerian State and LGA catalog" });
      toast.success(`Location catalog refreshed: ${result.total} active LGAs`);
      await refresh();
    } catch (error) {
      toast.error(cleanError(error, "Could not refresh the location catalog"));
    } finally {
      setRefreshingCatalog(false);
    }
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Delivery states"
        description="Where Hook delivers and what each State costs. Customers pay the price of the State in their delivery address."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManagePricing && unpriced > 0 ? (
              <Button size="sm" onClick={() => setConfirmDefaults(true)}>
                <Sparkles /> Apply regional prices
              </Button>
            ) : null}
            <Button variant="outline" size="sm" disabled={!canManageCoverage || refreshingCatalog} onClick={() => void refreshCatalog()}>
              {refreshingCatalog ? <Loader2 className="animate-spin" /> : <Database />} Refresh locations
            </Button>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw /> Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Available States" value={enabled} icon={CheckCircle2} intent="success" caption={`${states.length - enabled} paused`} />
        <MetricCard label="Average price" value={naira(average)} icon={BadgeDollarSign} caption={fees.length ? `${naira(Math.min(...fees))} to ${naira(Math.max(...fees))}` : "No prices yet"} />
        <MetricCard label="Without a price" value={unpriced} icon={AlertTriangle} intent={unpriced ? "warning" : "neutral"} caption={unpriced ? "Falls back to the default fee" : "All States priced"} />
        <MetricCard label="LGAs ready" value={states.reduce((sum, state) => sum + (state.lgaCount || 0), 0)} icon={MapPin} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            {(Object.keys(REGION_LABEL) as DeliveryRegion[]).map((region) => (
              <TabsTrigger key={region} value={region}>{REGION_LABEL[region]} ({counts[region]})</TabsTrigger>
            ))}
            <TabsTrigger value="unpriced">Unpriced ({counts.unpriced})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search State or capital" className="pl-9" />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden rounded-lg shadow-none">
        <CardHeader className="border-b">
          <CardTitle className="text-base">State delivery prices</CardTitle>
          <p className="text-sm text-muted-foreground">Edit a price and save it. Pause a State to stop new addresses and checkouts there.</p>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={rows.length === 0}
            loadingLabel="Loading delivery States"
            errorTitle="Delivery States could not be loaded"
            emptyTitle="No States match"
            emptyDescription="Try another search or region."
            emptyIcon={MapPin}
            onRetry={() => query.refetch()}
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>LGAs</TableHead>
                    <TableHead className="w-[250px]">Delivery price</TableHead>
                    <TableHead className="text-right">Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((state, index) => {
                    const region = regionOf(state.name);
                    const draft = drafts[state.publicId];
                    const current = state.deliveryFeeMinor !== undefined && state.deliveryFeeMinor !== null ? String(state.deliveryFeeMinor / 100) : "";
                    const dirty = draft !== undefined && draft !== current;
                    return (
                      <TableRow key={state.publicId}>
                        <TableCell className="text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-xs font-bold">{state.code}</div>
                            <div>
                              <p className="font-medium">{state.name}</p>
                              <p className="text-xs text-muted-foreground">{state.capitalName || "Capital not recorded"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{region ? <Badge variant="outline">{REGION_LABEL[region]}</Badge> : <span className="text-xs text-muted-foreground">Unassigned</span>}</TableCell>
                        <TableCell><span className="font-medium">{state.lgaCount || 0}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative w-32">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                              <Input
                                inputMode="numeric"
                                value={draft ?? current}
                                placeholder="Not set"
                                disabled={!canManagePricing}
                                onChange={(event) => setDrafts((existing) => ({ ...existing, [state.publicId]: event.target.value.replace(/[^\d.]/g, "") }))}
                                onKeyDown={(event) => { if (event.key === "Enter" && dirty) void savePrice(state); }}
                                className="h-9 pl-6 tabular-nums"
                                aria-label={`Delivery price for ${state.name}`}
                              />
                            </div>
                            {dirty ? (
                              <Button size="sm" onClick={() => void savePrice(state)} disabled={saving === state.publicId}>
                                {saving === state.publicId ? <Loader2 className="animate-spin" /> : <Save />} Save
                              </Button>
                            ) : null}
                            {!dirty && current === "" ? <Badge variant="secondary">Default fee</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Badge variant={state.deliveryEnabled ? "default" : "outline"}>
                              {state.deliveryEnabled ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}
                              {state.deliveryEnabled ? "Available" : "Paused"}
                            </Badge>
                            <Switch
                              checked={Boolean(state.deliveryEnabled)}
                              disabled={!canManageCoverage}
                              onCheckedChange={(value) => void toggleState(state, value)}
                              aria-label={`${state.deliveryEnabled ? "Pause" : "Enable"} delivery in ${state.name}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDefaults} onOpenChange={setConfirmDefaults}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Apply regional prices?</AlertDialogTitle>
            <AlertDialogDescription>
              {unpriced} State{unpriced === 1 ? " has" : "s have"} no price. They get North {naira(REGION_DEFAULT_FEE_MINOR.north)}, South {naira(REGION_DEFAULT_FEE_MINOR.south)}, East {naira(REGION_DEFAULT_FEE_MINOR.east)} and West {naira(REGION_DEFAULT_FEE_MINOR.west)}. States that already have a price are not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void applyRegionalDefaults(); }} disabled={applying}>
              {applying ? <Loader2 className="animate-spin" /> : "Apply prices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
