"use client";

import { useMemo } from "react";
import {
  Download,
  PackageCheck,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { KpiCard } from "@/components/shared/KpiCard";
import { useApiQuery } from "@/lib/query";
import {
  money,
  number,
  queryString,
  useUrlFilters,
  type Page,
} from "@/lib/admin-utils";

interface ApiOrder {
  id: string;
  orderCode?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  status: string;
  paymentStatus: string;
  total: number;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function OrdersPage() {
  const filters = useUrlFilters({
    page: "1",
    status: "all",
    paymentStatus: "all",
  });
  const page = filters.get("page") || "1";
  const search = filters.get("search");
  const status = filters.get("status") || "all";
  const paymentStatus = filters.get("paymentStatus") || "all";
  const path = `/admin/orders${queryString({ page, limit: 12, search, status, paymentStatus })}`;
  const queryKey = useMemo(
    () => ["admin", "orders", page, search, status, paymentStatus] as const,
    [page, search, status, paymentStatus],
  );
  const { data } = useApiQuery<Page<ApiOrder>>(queryKey, path);
  const stats = data?.stats || {};

  function exportCsv() {
    const rows = data?.data || [];
    if (!rows.length) {
      toast.info("There are no orders to export in this view.");
      return;
    }

    const header = ["Order", "Customer", "Status", "Payment", "Total"];
    const body = rows.map((order) => {
      const customer =
        `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
        order.user?.email ||
        "Customer";
      return [
        order.orderCode || order.id,
        customer,
        order.status,
        order.paymentStatus,
        order.total,
      ]
        .map(csvEscape)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hook-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Orders CSV exported.");
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 p-4 md:p-5">
      <PageHeader
        className="mb-0"
        title="Orders"
        description="Manage and track all customer orders in real-time."
        actions={
          <>
            <PermissionGuard permission="orders.view">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="flex items-center gap-1.5"
              >
                <Download size={15} />{" "}
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={WalletCards}
          tone="blue"
          label="Revenue"
          value={money(stats.revenue)}
          caption="All orders"
        />
        <KpiCard
          icon={ShoppingCart}
          tone="amber"
          label="Pending"
          value={number(stats.pending)}
          caption={`${number(stats.total)} total`}
        />
        <KpiCard
          icon={Truck}
          tone="green"
          label="In Transit"
          value={number(stats.inTransit)}
          caption="Active delivery"
        />
        <KpiCard
          icon={PackageCheck}
          tone="purple"
          label="Delivered"
          value={number(stats.delivered)}
          caption={`${number(stats.unpaid)} unpaid`}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
        <OrderFilters
          search={search}
          status={status}
          paymentStatus={paymentStatus}
          onSearchChange={(value) => filters.set({ search: value, page: 1 })}
          onStatusChange={(value) => filters.set({ status: value, page: 1 })}
          onPaymentStatusChange={(value) =>
            filters.set({ paymentStatus: value, page: 1 })
          }
          onClear={() =>
            filters.set({
              search: "",
              status: "all",
              paymentStatus: "all",
              page: 1,
            })
          }
        />
        <OrdersTable
          queryKey={queryKey}
          path={path}
          onPageChange={(nextPage) => filters.set({ page: nextPage })}
        />
      </div>
    </div>
  );
}
