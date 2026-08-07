"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

interface ApiOrder {
  id: string;
  orderCode?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  items?: Array<{ productTitle?: string }>;
  status: string;
  total: number;
  paymentStatus: string;
  logistics?: { estimatedDeliveryAt?: string };
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

interface OrdersTableProps {
  queryKey: readonly unknown[];
  path: string;
  onPageChange: (page: number) => void;
}

export function OrdersTable({
  queryKey,
  path,
  onPageChange,
}: OrdersTableProps) {
  const { data, isLoading, isFetching, error, refetch } = useApiQuery<
    Page<ApiOrder>
  >(queryKey, path);
  const orders = data?.data || [];
  const meta = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
  };
  const errorMessage =
    error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";
  const start = orders.length ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = orders.length ? start + orders.length - 1 : 0;

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="min-w-[1120px]">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-b border-zinc-100 bg-zinc-50">
              {[
                "No",
                "Order ID",
                "Customer",
                "Product",
                "Status",
                "Amount",
                "Payment",
                "ETA",
                "",
              ].map((header) => (
                <TableHead
                  key={header}
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 ${header === "Amount" ? "text-right" : ""}`}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-3 py-12 whitespace-normal sm:px-5"
                >
                  <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                    <HookLoader label="Loading orders..." />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {errorMessage && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-3 py-12 whitespace-normal sm:px-5"
                >
                  <div className="mx-auto w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="font-semibold text-red-700">
                      Orders could not be loaded
                    </p>
                    <p className="mx-auto mt-1 max-w-md whitespace-normal break-words text-sm leading-6 text-red-600">
                      {errorMessage}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 bg-white"
                      onClick={() => refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !errorMessage && orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-3 py-14 whitespace-normal sm:px-5 sm:py-16"
                >
                  <div className="mx-auto flex min-h-56 w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-8 text-center sm:px-8">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm sm:size-16">
                      <PackageSearch size={26} />
                    </div>
                    <p className="text-base font-semibold text-zinc-900 sm:text-lg">
                      No orders found for this view
                    </p>
                    <p className="mx-auto mt-2 max-w-xl whitespace-normal break-words text-sm leading-6 text-zinc-500 sm:text-base">
                      Try another search, adjust the order filters, or create a
                      new order when you are ready.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {orders.map((order, index) => {
              const name =
                `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
                order.user?.email ||
                "Customer";
              const initials = name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const item = order.items?.[0];

              return (
                <TableRow
                  key={order.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50"
                >
                  <TableCell className="px-4 py-3 text-xs font-semibold text-zinc-400">
                    {start + index}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.orderCode || order.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-600">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-zinc-700">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-600">
                    {item?.productTitle || `${order.items?.length || 0} items`}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">
                    ₦{Number(order.total || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-400">
                    {order.logistics?.estimatedDeliveryAt ? "Scheduled" : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        aria-label={`View ${order.orderCode || order.id}`}
                      >
                        <Eye size={16} />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {start} to {end} of {meta.total} results{" "}
          {isFetching && !isLoading ? "· refreshing" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={meta.page <= 1 || isFetching}
            onClick={() => onPageChange(meta.page - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            size="sm"
            className="h-8 min-w-8 bg-zinc-900 px-2 text-white hover:bg-zinc-800"
          >
            {meta.page}
          </Button>
          <span className="px-1">/ {meta.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            disabled={meta.page >= meta.totalPages || isFetching}
            onClick={() => onPageChange(meta.page + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}
