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

import { MetricCard } from "@/components/shared/MetricCard";
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Operating now" value={operatingCount} icon={CheckCircle2} intent="success" />
        <MetricCard label="States with Markets" value={marketStateCount} icon={Store} />
        <MetricCard label="Coming soon" value={comingSoonCount} icon={Clock3} intent={comingSoonCount ? "warning" : "neutral"} caption="No active Market yet" />
        <MetricCard label="Needs attention" value={attentionCount} icon={AlertTriangle} intent={attentionCount ? "danger" : "neutral"} caption={attentionCount ? "Market exists, operations paused" : "Nothing to review"} />
      </div>

      <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-none">
        <CardHeader className="flex-col items-start gap-4 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">State directory</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Enable or pause sourcing operations by State.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search State or capital" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={!query.isLoading && !query.isError && !filteredStates.length}
            loadingLabel="Loading operating States"
            errorTitle="Operating States could not be loaded"
            emptyTitle="No States match"
            emptyDescription="Try another search."
            emptyIcon={MapPinned}
            onRetry={() => query.refetch()}
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
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
            </div>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
