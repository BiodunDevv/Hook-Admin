"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Check,
  ClipboardCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiPatch, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Row = {
  id?: string;
  publicId?: string;
  status?: string;
  marketId?: string;
  runnerId?: string;
  hubId?: string;
  summary?: string;
  severity?: string;
  type?: string;
  orderId?: string;
  version?: number;
};

type Runner = Row & {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type Hub = Row & { name?: string; stateId?: string };
type DirectoryResponse<T> = { data: T[] } | T[];

type ControlTower = {
  tasks: Row[];
  exceptions: Row[];
  shipments: Row[];
  returns: Row[];
  metrics: {
    openTasks: number;
    openExceptions: number;
    activeShipments: number;
    openReturns: number;
  };
};

type AssignmentForm = { runnerId?: string; hubId?: string; reason?: string };

const workflowLinks = [
  { label: "Control tower", href: "/dashboard/fulfilment" },
  { label: "Hub workspace", href: "/dashboard/fulfilment/hub" },
  { label: "Shipments", href: "/dashboard/fulfilment/shipments" },
  { label: "Returns", href: "/dashboard/fulfilment/returns" },
  { label: "Refunds", href: "/dashboard/fulfilment/refunds" },
];

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const identifier = (row?: Row) => row?.publicId || row?.id || "";

export default function FulfilmentControlTowerPage() {
  const query = useApiQuery<ControlTower>(
    ["admin", "fulfilment", "control-tower"],
    "/admin/fulfilment/control-tower",
  );
  const runnersQuery = useApiQuery<DirectoryResponse<Runner>>(
    ["admin", "fulfilment", "runners"],
    "/admin/fulfilment/runners?limit=100",
  );
  const hubsQuery = useApiQuery<DirectoryResponse<Hub>>(
    ["admin", "fulfilment", "hubs"],
    "/admin/fulfilment/hubs?limit=100",
  );
  const [selectedTask, setSelectedTask] = useState<Row>();
  const [selectedException, setSelectedException] = useState<Row>();
  const [assignments, setAssignments] = useState<
    Record<string, AssignmentForm>
  >({});
  const [exceptionReasons, setExceptionReasons] = useState<
    Record<string, string>
  >({});
  const [pending, setPending] = useState<string>();

  const data = query.data;
  const runners = Array.isArray(runnersQuery.data)
    ? runnersQuery.data
    : runnersQuery.data?.data || [];
  const hubs = Array.isArray(hubsQuery.data)
    ? hubsQuery.data
    : hubsQuery.data?.data || [];

  async function reassign() {
    const taskId = identifier(selectedTask);
    const form = taskId ? assignments[taskId] : undefined;
    if (
      !taskId ||
      !form?.runnerId ||
      !form.hubId ||
      !form.reason?.trim() ||
      !selectedTask?.version
    ) {
      toast.error("Choose a Runner, Hub, and reason before reassigning");
      return;
    }

    setPending(`assign-${taskId}`);
    try {
      await apiPost(`/admin/fulfilment/tasks/${taskId}/reassign`, {
        ...form,
        reason: form.reason.trim(),
        version: selectedTask.version,
      });
      toast.success("Fulfilment task reassigned");
      setSelectedTask(undefined);
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message.replace(/^\d+:\s*/, "")
          : "Task could not be reassigned",
      );
    } finally {
      setPending(undefined);
    }
  }

  async function resolveException() {
    const exceptionId = identifier(selectedException);
    const reason = exceptionId ? exceptionReasons[exceptionId]?.trim() : "";
    if (!exceptionId || !reason) {
      toast.error("Add a resolution reason first");
      return;
    }

    setPending(`exception-${exceptionId}`);
    try {
      await apiPatch(`/admin/fulfilment/exceptions/${exceptionId}`, {
        status: "RESOLVED",
        reason,
      });
      toast.success("Exception resolved");
      setSelectedException(undefined);
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message.replace(/^\d+:\s*/, "")
          : "Exception could not be resolved",
      );
    } finally {
      setPending(undefined);
    }
  }

  const metrics = data
    ? [
        { label: "Open tasks", value: data.metrics.openTasks, icon: Box },
        {
          label: "Open exceptions",
          value: data.metrics.openExceptions,
          icon: AlertTriangle,
          intent: "danger" as const,
        },
        {
          label: "Active shipments",
          value: data.metrics.activeShipments,
          icon: Truck,
        },
        {
          label: "Returns to review",
          value: data.metrics.openReturns,
          icon: RotateCcw,
          intent: "warning" as const,
        },
      ]
    : [];

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        className="mb-0"
        title="Fulfilment Control Tower"
        description="Monitor Runner sourcing, Hub readiness, shipments, exceptions, returns, and refunds across the current operating scope."
      />

      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 shadow-card"
        aria-label="Fulfilment workspaces"
      >
        {workflowLinks.map((item, index) => (
          <Button
            key={item.href}
            asChild
            variant={index === 0 ? "ink" : "ghost"}
            size="sm"
            className="shrink-0"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>

      <QueryState
        loading={query.isLoading}
        error={
          query.error ||
          (!data ? new Error("No fulfilment data was returned") : undefined)
        }
        loadingLabel="Loading fulfilment control tower..."
        errorTitle="Fulfilment operations could not be loaded"
        onRetry={() => query.refetch()}
      >
        {data ? (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
              <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-card">
                <CardHeader className="flex-row items-center justify-between border-b px-4 py-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Runner tasks
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Prioritized by operational SLA
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {data.tasks.length} active
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  {data.tasks.length ? (
                    data.tasks.slice(0, 12).map((task) => {
                      const taskId = identifier(task);
                      const canReassign = ![
                        "BLOCKED",
                        "HUB_RECEIVED",
                        "QC_PASSED",
                      ].includes(task.status || "");
                      return (
                        <div
                          key={taskId}
                          className="grid gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <Link
                                href={`/dashboard/fulfilment/tasks/${taskId}`}
                                className="truncate text-sm font-medium hover:underline"
                              >
                                {taskId}
                              </Link>
                              <StatusBadge status={task.status || "Unknown"} />
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              Market {task.marketId || "unassigned"} · Runner{" "}
                              {task.runnerId || "unassigned"} · Hub{" "}
                              {task.hubId || "unassigned"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {canReassign ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTask(task)}
                              >
                                Reassign
                              </Button>
                            ) : null}
                            <Button asChild variant="ghost" size="icon-sm">
                              <Link
                                href={`/dashboard/fulfilment/tasks/${taskId}`}
                                aria-label={`View ${taskId}`}
                              >
                                <ArrowRight />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <QueryState
                      empty
                      emptyTitle="No active fulfilment tasks"
                      emptyDescription="New approved orders will appear here automatically."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-card">
                <CardHeader className="flex-row items-center justify-between border-b px-4 py-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      Operational exceptions
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Customer-impacting issues requiring review
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {data.exceptions.length} open
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  {data.exceptions.length ? (
                    data.exceptions.slice(0, 10).map((item) => {
                      const exceptionId = identifier(item);
                      return (
                        <div
                          key={exceptionId}
                          className="grid gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {item.summary || exceptionId}
                              </p>
                              <StatusBadge
                                status={item.severity || "Unknown"}
                              />
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {label(item.type)} ·{" "}
                              {item.orderId || "No order reference"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedException(item)}
                          >
                            <Check /> Resolve
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <QueryState
                      empty
                      emptyTitle="No open exceptions"
                      emptyDescription="Operations are currently clear."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: "/dashboard/fulfilment/hub",
                  icon: ClipboardCheck,
                  title: "Hub receiving",
                  detail:
                    "Receive packages and complete visible quality checks.",
                },
                {
                  href: "/dashboard/fulfilment/shipments",
                  icon: Truck,
                  title: "Shipment operations",
                  detail:
                    "Book logistics and monitor controlled tracking updates.",
                },
                {
                  href: "/dashboard/fulfilment/returns",
                  icon: RotateCcw,
                  title: "Returns and refunds",
                  detail:
                    "Review customer issues and eligible refund outcomes.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-lg border bg-card p-4 shadow-card transition-colors hover:bg-muted/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                    <item.icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                      {item.title} <ArrowRight className="size-3.5" />
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </QueryState>

      <AdminWorkflowSheet
        open={Boolean(selectedTask)}
        onOpenChange={(open) => {
          if (!open && pending !== `assign-${identifier(selectedTask)}`) setSelectedTask(undefined);
        }}
        title="Reassign fulfilment task"
        description="Select a compatible Runner and Hub. The change is version-checked and recorded in the audit trail."
        footer={(
          <>
            <Button variant="outline" onClick={() => setSelectedTask(undefined)} disabled={pending === `assign-${identifier(selectedTask)}`}>Cancel</Button>
            <Button variant="brand" onClick={() => void reassign()} disabled={pending === `assign-${identifier(selectedTask)}`}>
              {pending === `assign-${identifier(selectedTask)}` ? <HookLoader size="button" variant="dark" /> : "Confirm reassignment"}
            </Button>
          </>
        )}
      >
          {selectedTask ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Runner</Label>
                  <Select
                    value={assignments[identifier(selectedTask)]?.runnerId}
                    onValueChange={(value) =>
                      setAssignments((current) => ({
                        ...current,
                        [identifier(selectedTask)]: {
                          ...current[identifier(selectedTask)],
                          runnerId: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Runner" />
                    </SelectTrigger>
                    <SelectContent>
                      {runners.map((runner) => {
                        const value = identifier(runner);
                        const name =
                          `${runner.firstName || ""} ${runner.lastName || ""}`.trim() ||
                          runner.email ||
                          value;
                        return value ? (
                          <SelectItem key={value} value={value}>
                            {name}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dispatch Hub</Label>
                  <Select
                    value={assignments[identifier(selectedTask)]?.hubId}
                    onValueChange={(value) =>
                      setAssignments((current) => ({
                        ...current,
                        [identifier(selectedTask)]: {
                          ...current[identifier(selectedTask)],
                          hubId: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map((hub) => {
                        const value = identifier(hub);
                        return value ? (
                          <SelectItem key={value} value={value}>
                            {hub.name || value}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reassign-reason">Audit reason</Label>
                <Textarea
                  id="reassign-reason"
                  value={assignments[identifier(selectedTask)]?.reason || ""}
                  onChange={(event) =>
                    setAssignments((current) => ({
                      ...current,
                      [identifier(selectedTask)]: {
                        ...current[identifier(selectedTask)],
                        reason: event.target.value,
                      },
                    }))
                  }
                  placeholder="Why is this task being reassigned?"
                />
              </div>
            </div>
          ) : null}
      </AdminWorkflowSheet>

      <AdminWorkflowSheet
        open={Boolean(selectedException)}
        onOpenChange={(open) => {
          if (!open && pending !== `exception-${identifier(selectedException)}`) setSelectedException(undefined);
        }}
        title="Resolve operational exception"
        description={`Record the verified outcome for ${identifier(selectedException)}. This action is audited.`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setSelectedException(undefined)} disabled={pending === `exception-${identifier(selectedException)}`}>Cancel</Button>
            <Button variant="ink" onClick={() => void resolveException()} disabled={pending === `exception-${identifier(selectedException)}`}>
              {pending === `exception-${identifier(selectedException)}` ? <HookLoader size="button" variant="yellow" /> : "Resolve exception"}
            </Button>
          </>
        )}
      >
          {selectedException ? (
            <div className="space-y-2">
              <Label htmlFor="exception-reason">Resolution note</Label>
              <Textarea
                id="exception-reason"
                value={exceptionReasons[identifier(selectedException)] || ""}
                onChange={(event) =>
                  setExceptionReasons((current) => ({
                    ...current,
                    [identifier(selectedException)]: event.target.value,
                  }))
                }
                placeholder="Describe the verified resolution"
              />
            </div>
          ) : null}
      </AdminWorkflowSheet>
    </div>
  );
}
