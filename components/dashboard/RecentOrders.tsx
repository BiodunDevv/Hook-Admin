 "use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

const paymentColors: Record<string, string> = {
  PAID: "text-emerald-600",
  PENDING: "text-amber-600",
  UNPAID: "text-red-500",
};

interface ApiOrder {
  id: string;
  orderCode?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  items?: Array<{ productTitle?: string }>;
  status: string;
  total: number;
  paymentStatus: string;
}

interface Page<T> { data: T[]; }

export default function RecentOrders() {
  const { data, isLoading } = useApiQuery<Page<ApiOrder>>(["admin", "recent-orders"], "/admin/orders?limit=5");
  const orders = data?.data || [];

  return (
    <Card className="shadow-card border-zinc-200 py-0">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900">Recent Orders</h3>
            <p className="text-sm text-zinc-400">
              Latest transactions across the network
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 border-zinc-200">
            View All
          </Button>
        </div>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Order ID
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Customer
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Status
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4} className="py-8"><HookLoader label="Loading orders..." /></TableCell></TableRow>}
              {!isLoading && orders.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-zinc-500">No recent orders yet.</TableCell></TableRow>}
              {orders.map((order) => {
                const name = `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() || order.user?.email || "Customer";
                const item = order.items?.[0];
                return (
                <TableRow key={order.id} className="border-zinc-100">
                  <TableCell className="align-top">
                    <p className="font-medium text-zinc-900">{order.orderCode || order.id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-400">{item?.productTitle || `${order.items?.length || 0} items`}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <p className="text-zinc-700">{name}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <p className="font-semibold text-zinc-900">₦{Number(order.total || 0).toLocaleString()}</p>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        paymentColors[order.paymentStatus?.toUpperCase()] || "text-zinc-500"
                      )}
                    >
                      {order.paymentStatus}
                    </p>
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
