"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPinned,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiPatch } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { useAdminSession, useApiQuery } from "@/lib/query";

type State = {
  publicId: string;
  name: string;
  capitalName?: string;
  code: string;
  operationsEnabled?: boolean;
  marketCount?: number;
  status?: string;
};

type Page = { data: State[]; total?: number };
const pageGutter = "w-full space-y-5 px-4 py-5";

function stateStatus(state: State) {
  if (state.operationsEnabled && (state.marketCount || 0) > 0) {
    return { label: "Operating", icon: CheckCircle2, variant: "default" as const };
  }
  if (state.operationsEnabled) {
    return { label: "Ready for market setup", icon: MapPinned, variant: "secondary" as const };
  }
  if ((state.marketCount || 0) > 0) {
    return { label: "Needs attention", icon: AlertTriangle, variant: "destructive" as const };
  }
  return { label: "Coming soon", icon: Clock3, variant: "outline" as const };
}

export function OperatingStatesPage() {
  const session = useAdminSession();
  const query = useApiQuery<Page>(["admin", "operating-states"], "/admin/states?limit=100");
  const [search, setSearch] = useState("");
  const canManage = hasPermission(session.data, "states.manage");
  const states = query.data?.data || [];
  const filteredStates = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return states;
    return states.filter((state) =>
      `${state.name} ${state.capitalName || ""} ${state.code}`.toLowerCase().includes(value),
    );
  }, [search, states]);

  async function toggle(state: State, enabled: boolean) {
    try {
      await apiPatch(`/admin/states/${state.publicId}`, {
        operationsEnabled: enabled,
        reason: enabled ? "Enabled Hook operations" : "Paused Hook operations",
      });
      await query.refetch();
      toast.success(`${state.name} operations ${enabled ? "enabled" : "paused"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the State");
    }
  }

  if (query.isLoading || query.error) {
    return (
      <div className={pageGutter}>
        <QueryState
          loading={query.isLoading}
          error={query.error}
          loadingLabel="Loading operating States"
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const operatingCount = states.filter((state) => state.operationsEnabled).length;
  const marketStateCount = states.filter((state) => (state.marketCount || 0) > 0).length;
  const comingSoonCount = states.filter((state) => !state.operationsEnabled && !(state.marketCount || 0)).length;
  const attentionCount = states.filter((state) => !state.operationsEnabled && (state.marketCount || 0) > 0).length;

  return (
    <div className={pageGutter}>
      <PageHeader
        title="Operating States"
        description="Control where Hook currently sources products and runs Market operations. Delivery coverage is managed separately."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <Card className="overflow-hidden border-0 bg-[#FFC809] shadow-none ring-0">
        <CardContent className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border-[24px] border-white/20" />
          <div className="relative max-w-2xl">
            <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-black text-[#FFC809]">
              <MapPinned className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/60">Operations footprint</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black sm:text-3xl">Where Hook operates</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/70">
              A State becomes operational when Hook can assign Markets, Runners, and dispatch work there. States without a Market remain available for future expansion.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Operating now</p><p className="mt-1 text-2xl font-semibold">{operatingCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Store className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">States with Markets</p><p className="mt-1 text-2xl font-semibold">{marketStateCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Clock3 className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Coming soon</p><p className="mt-1 text-2xl font-semibold">{comingSoonCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-700"><AlertTriangle className="size-5" /></div>
            <div><p className="text-sm text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-semibold">{attentionCount}</p></div>
          </CardContent>
        </Card>
      </div>

      {comingSoonCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#F0D979] bg-[#FFF9DC] px-4 py-3 text-sm text-[#665100]">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          <p><span className="font-semibold">More States coming soon.</span> These States are in the national directory but do not have an active Hook Market yet.</p>
        </div>
      ) : null}

      {attentionCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p><span className="font-semibold">Review paused operations.</span> A Market exists in at least one State whose operations are currently disabled.</p>
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>State directory</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Enable or pause sourcing operations by State.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search State or capital" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Markets</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead className="text-right">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStates.map((state, index) => {
                const status = stateStatus(state);
                const StatusIcon = status.icon;
                return (
                  <TableRow key={state.publicId}>
                    <TableCell className="text-center text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-xs font-bold">{state.code}</div>
                        <div><p className="font-medium">{state.name}</p><p className="text-xs text-muted-foreground">{state.publicId}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{state.capitalName || "Not recorded"}</TableCell>
                    <TableCell><span className="font-medium">{state.marketCount || 0}</span><span className="ml-1 text-xs text-muted-foreground">active</span></TableCell>
                    <TableCell><Badge variant={status.variant}><StatusIcon className="size-3" />{status.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="hidden text-xs text-muted-foreground sm:inline">{state.operationsEnabled ? "Enabled" : "Paused"}</span>
                        <Switch aria-label={`${state.operationsEnabled ? "Pause" : "Enable"} operations in ${state.name}`} checked={Boolean(state.operationsEnabled)} disabled={!canManage} onCheckedChange={(enabled) => void toggle(state, enabled)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!filteredStates.length ? <div className="px-6 py-12 text-center text-sm text-muted-foreground">No States match your search.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
