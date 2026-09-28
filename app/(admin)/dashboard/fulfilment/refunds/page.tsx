"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/shared/FilterBar";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { ListRow, initialsOf } from "@/components/shared/ListRow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "sonner";

type Row = {
  id?: string;
  publicId?: string;
  amountMinor?: number;
  orderId?: string;
  reason?: string;
  status?: string;
  idempotencyKey?: string;
  order?: { publicId?: string } | null;
};

const money = (minor?: number) => `₦${(Number(minor || 0) / 100).toLocaleString()}`;

/** Statuses that still have work left for finance to do. */
const ACTIONABLE = ["REQUESTED", "APPROVED", "FAILED"];

/** Finance's cross-order refund worklist: refunds that failed or are pending, wherever they came from. */
export default function FulfilmentRefundsPage() {
  const query = useApiQuery<Row[]>(
    ["admin", "fulfilment", "refunds"],
    "/admin/fulfilment/refunds?limit=100",
  );
  const [pending, setPending] = useState<string>();
  const [search, setSearch] = useState("");
  const allRows = query.data || [];
  const outstanding = allRows.filter((row) => ACTIONABLE.includes(row.status ?? "")).length;
  const failed = allRows.filter((row) => row.status === "FAILED").length;
  const needle = search.trim().toLowerCase();
  const rows = allRows.filter((row) => {
    const id = row.publicId || row.id;
    return (
      !needle ||
      [id, row.order?.publicId, row.orderId, row.reason, row.status].some((value) =>
        value?.toLowerCase().includes(needle),
      )
    );
  });

  async function process(item: Row) {
    const id = item.publicId || item.id;
    if (!id) return;
    setPending(id);
    try {
      await apiPost(`/admin/fulfilment/refunds/${id}/process`, {
        idempotencyKey: item.idempotencyKey,
      });
      toast.success("Refund sent to the provider.");
      await query.refetch();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message.replace(/^\d+:\s*/, "")
          : "The refund could not be processed.",
      );
    } finally {
      setPending(undefined);
    }
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Refund processing"
        description="Refunds are executed against captured Paystack balances and retain provider evidence."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Awaiting action" value={outstanding} icon={CircleAlert} intent={outstanding ? "warning" : "neutral"} />
        <MetricCard label="Failed" value={failed} icon={CircleAlert} intent={failed ? "danger" : "neutral"} />
        <MetricCard label="Total refunds" value={allRows.length} icon={CircleCheck} intent="info" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search refund, order, or reason"
        active={Boolean(search)}
        onClear={() => setSearch("")}
        hint="Refine this list"
      />

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-base">Refund queue</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {outstanding
                ? `${outstanding} refund${outstanding === 1 ? "" : "s"} awaiting action.`
                : "Nothing is waiting on finance."}{" "}
              Start a refund from the order you are refunding.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={rows.length === 0}
            loadingLabel="Loading refunds"
            errorTitle="Refunds could not be loaded"
            emptyTitle="No refund records"
            emptyDescription="Refunds raised from an order will appear here for processing."
            emptyIcon={RotateCcw}
            onRetry={() => query.refetch()}
          >
            {rows.map((item, index) => {
              const id = item.publicId || item.id || `refund-${index}`;
              const orderRef = item.order?.publicId || item.orderId;
              const failed = item.status === "FAILED";
              return (
                <ListRow
                  key={id}
                  index={index + 1}
                  initials={initialsOf(item.status || "refund")}
                  // Tint rows where a refund failed, since money never reached the customer.
                  tint={failed ? "bg-danger-soft/40 hover:bg-danger-soft/50" : undefined}
                  title={<span className="truncate text-sm font-semibold text-zinc-950">{id}</span>}
                  subject={money(item.amountMinor)}
                  meta={[
                    orderRef ? (
                      <Link href={`/dashboard/orders/${orderRef}`} className="hover:underline">
                        {orderRef}
                      </Link>
                    ) : (
                      "No order reference"
                    ),
                    item.reason,
                  ]}
                  actions={
                    <>
                      <StatusBadge status={item.status || "REQUESTED"} />
                      {ACTIONABLE.includes(item.status ?? "") ? (
                        <PermissionGuard permission="finance.refunds.process">
                          <Button size="sm" onClick={() => void process(item)} disabled={pending === id}>
                            {pending === id ? <HookLoader size="button" /> : "Process refund"}
                          </Button>
                        </PermissionGuard>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
