"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiGet } from "@/lib/api";

interface ApiOrder {
  id: string;
  orderCode?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  items?: Array<{ productTitle?: string; vendor?: { businessName?: string } }>;
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
}

const paymentColors: Record<string, string> = {
  PAID: "text-emerald-600",
  PENDING: "text-amber-600",
  UNPAID: "text-red-500",
  REFUNDED: "text-zinc-400",
};

export function OrdersTable() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Page<ApiOrder>>("/admin/orders")
      .then((result) => {
        setOrders(result.data);
        setMeta({ total: result.total, page: result.page, limit: result.limit });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-100 bg-zinc-50">
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Order ID</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Customer</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Product</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Vendor</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Amount</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Payment</TableHead>
              <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={8} className="px-5 py-8 text-center text-zinc-500">Loading orders...</TableCell></TableRow>}
            {error && <TableRow><TableCell colSpan={8} className="px-5 py-8 text-center text-red-600">{error}</TableCell></TableRow>}
            {!loading && !error && orders.length === 0 && <TableRow><TableCell colSpan={8} className="px-5 py-8 text-center text-zinc-500">No orders yet.</TableCell></TableRow>}
            {orders.map((order) => {
              const name = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || order.user?.email || "Customer";
              const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              const item = order.items?.[0];
              return (
              <TableRow key={order.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                <TableCell className="px-5 py-4 font-medium text-zinc-900">{order.orderCode || order.id.slice(0, 8)}</TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-600">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-zinc-700">{name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-zinc-600">{item?.productTitle || `${order.items?.length || 0} items`}</TableCell>
                <TableCell className="px-5 py-4 text-zinc-600">{item?.vendor?.businessName || "Multiple vendors"}</TableCell>
                <TableCell className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="px-5 py-4 font-semibold text-zinc-900">₦{Number(order.total || 0).toLocaleString()}</TableCell>
                <TableCell className="px-5 py-4">
                  <span className={cn("text-[11px] font-bold uppercase", paymentColors[order.paymentStatus?.toUpperCase()] || "text-zinc-500")}>
                    {order.paymentStatus}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 text-zinc-400">{order.logistics?.estimatedDeliveryAt ? "Scheduled" : "—"}</TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3 text-sm text-zinc-500">
        <span>Showing {orders.length ? 1 : 0} to {orders.length} of {meta.total} results</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3">
            <ChevronLeft size={14} />
          </Button>
          <Button size="sm" className="h-8 w-8 bg-zinc-900 p-0 text-white hover:bg-zinc-800">1</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">2</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">3</Button>
          <span className="px-1">...</span>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}
