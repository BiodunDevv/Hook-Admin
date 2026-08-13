"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
} from "lucide-react";
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
      {isLoading ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
            <HookLoader label="Loading orders..." />
          </div>
        </div>
      ) : errorMessage ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-5 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-red-500">
              <AlertTriangle size={20} />
            </div>
            <p className="font-semibold text-red-700">Orders could not be loaded</p>
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
        </div>
      ) : orders.length === 0 ? (
        <div className="border-t border-zinc-100 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
              <PackageSearch size={26} />
            </div>
            <p className="text-base font-semibold text-zinc-900 sm:text-lg">
              No orders found for this view
            </p>
            <p className="mx-auto mt-2 max-w-md whitespace-normal break-words text-sm leading-6 text-zinc-500">
              Try another search or adjust the order filters.
            </p>
          </div>
        </div>
      ) : (
        <>
        <div className="space-y-3 border-t border-zinc-100 p-3 md:hidden">
          {orders.map((order, index) => {
            const name = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || order.user?.email || "Customer";
            const item = order.items?.[0];
            return <article key={order.id} className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-semibold text-zinc-400">#{start + index}</p><Link href={`/dashboard/orders/${order.id}`} className="mt-1 block truncate font-semibold text-zinc-950">{order.orderCode || order.id.slice(0, 8)}</Link><p className="mt-1 truncate text-sm text-zinc-500">{name}</p></div>
                <Button asChild variant="outline" size="sm"><Link href={`/dashboard/orders/${order.id}`}><Eye size={15} /> View</Link></Button>
              </div>
              <div className="my-3 border-t border-zinc-100" />
              <p className="truncate text-sm text-zinc-600">{item?.productTitle || `${order.items?.length || 0} items`}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs text-zinc-400">Order total</span><span className="font-bold tabular-nums">₦{Number(order.total || 0).toLocaleString()}</span></div>
            </article>;
          })}
        </div>
        <div className="hidden min-w-0 divide-y divide-zinc-100 border-t border-zinc-100 md:block">
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

              return <article key={order.id} className="group flex min-w-0 items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 xl:px-5">
                <span className="w-6 shrink-0 text-xs font-semibold tabular-nums text-zinc-400">{start + index}</span>
                <Avatar className="size-9 shrink-0"><AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-600">{initials}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link href={`/dashboard/orders/${order.id}`} className="truncate text-sm font-semibold text-zinc-950 hover:underline">{order.orderCode || order.id.slice(0, 8)}</Link>
                    <span className="text-zinc-300">·</span>
                    <span className="truncate text-sm font-medium text-zinc-700">{name}</span>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-zinc-500">
                    <span className="truncate">{item?.productTitle || `${order.items?.length || 0} items`}</span>
                    <span className="text-zinc-300">|</span>
                    <span className="shrink-0 font-semibold tabular-nums text-zinc-700">₦{Number(order.total || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={order.paymentStatus} />
                  <StatusBadge status={order.status} />
                  <Button asChild variant="outline" size="icon-sm"><Link href={`/dashboard/orders/${order.id}`} aria-label={`View ${order.orderCode || order.id}`}><Eye size={15} /></Link></Button>
                </div>
              </article>;
            })}
        </div>
        </>
      )}

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
