"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, MapPin, PackageCheck, ShoppingCart, Truck, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, money, number } from "@/lib/admin-utils";

interface OrderDetail {
  id: string;
  orderCode: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryAddress: { street: string; city: string; state: string; phone: string; landmark?: string };
  user?: { email?: string; firstName?: string; lastName?: string };
  items?: Array<{ id: string; productTitle: string; quantity: number; unitPrice: number; totalPrice: number; productImage?: string }>;
  logistics?: { driverId?: string; driver?: { firstName?: string; lastName?: string; email?: string }; status?: string };
}
interface DriverResponse { data: Array<{ id: string; email: string; firstName?: string; lastName?: string }>; }

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<OrderDetail>(["admin", "orders", id], `/admin/orders/${id}`, Boolean(id));
  const drivers = useApiQuery<DriverResponse>(["admin", "drivers", "assign"], "/admin/dispatch/drivers");
  const updateStatus = useApiPatch<OrderDetail, { status: string }>(`/admin/orders/${id}/status`, ["admin", "orders"], { successMessage: "Order status updated" });
  const updateOrder = useApiPatch<OrderDetail, Record<string, unknown>>(`/admin/orders/${id}`, ["admin", "orders"], { successMessage: "Order updated" });
  const assignDriver = useApiPatch<unknown, { driverId: string }>(`/admin/orders/${id}/assign-driver`, ["admin", "orders"], { successMessage: "Driver assigned" });
  const [editing, setEditing] = useState(false);
  const order = query.data;
  const customer = `${order?.user?.firstName || ""} ${order?.user?.lastName || ""}`.trim() || order?.user?.email || "Customer";

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto p-2 pb-6 sm:p-4 sm:pb-8">
      <PageHeader
        title={order?.orderCode || "Order Detail"}
        description={`${customer} • ${order?.deliveryAddress?.city || "Delivery city"}`}
        actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>{order && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit3 size={15} /> Edit</Button>}</>}
      />

      {query.isLoading && <Card className="rounded-lg shadow-card"><CardContent className="p-4"><HookLoader label="Loading order..." /></CardContent></Card>}
      {query.error && <Card className="rounded-lg border-red-200 bg-red-50 shadow-none"><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}

      {order && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={WalletCards} tone="blue" label="Total" value={money(order.total)} caption={`${money(order.subtotal)} subtotal`} />
            <KpiCard icon={ShoppingCart} tone="amber" label="Items" value={number(order.items?.length)} caption={order.status} />
            <KpiCard icon={Truck} tone="green" label="Delivery" value={money(order.deliveryFee)} caption={order.logistics?.status || "Not assigned"} />
            <KpiCard icon={PackageCheck} tone="purple" label="Payment" value={order.paymentStatus} caption={`${money(order.discount)} discount`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
              <CardContent className="space-y-4 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Order status</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Payment</span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
                <div>
                  <p className="text-zinc-500">Customer</p>
                  <p className="mt-1 font-medium text-zinc-900">{customer}</p>
                  <p className="text-xs text-zinc-400">{order.user?.email}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-zinc-500"><MapPin size={14} /> Delivery address</p>
                  <p className="mt-1 leading-6 text-zinc-700">{order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                  <p className="text-xs text-zinc-400">{order.deliveryAddress.phone}{order.deliveryAddress.landmark ? ` • ${order.deliveryAddress.landmark}` : ""}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-zinc-500">Update status</p>
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue={order.status} onChange={(event) => updateStatus.mutate({ status: event.target.value })}>
                    {["pending", "confirmed", "processing", "packed", "picked_up", "in_transit", "delivered", "cancelled", "returned", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-zinc-500">Assign driver</p>
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue={order.logistics?.driverId || ""} onChange={(event) => event.target.value && assignDriver.mutate({ driverId: event.target.value })}>
                    <option value="">Unassigned</option>
                    {(drivers.data?.data || []).map((driver) => <option key={driver.id} value={driver.id}>{`${driver.firstName || ""} ${driver.lastName || ""}`.trim() || driver.email}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-zinc-200 py-0 shadow-card lg:col-span-2">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">Line Items</h3>
                <div className="overflow-hidden rounded-lg border border-zinc-200">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_64px_112px] gap-2 border-b border-zinc-100 px-3 py-3 text-sm last:border-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{item.productTitle}</p>
                        <p className="text-xs text-zinc-400">{money(item.unitPrice)} each</p>
                      </div>
                      <span className="text-zinc-600">{item.quantity}x</span>
                      <span className="text-right font-semibold text-zinc-900">{money(item.totalPrice)}</span>
                    </div>
                  ))}
                  {!order.items?.length && <p className="p-4 text-sm text-zinc-500">No line items on this order.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {order && (
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-w-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit order</DialogTitle>
              <DialogDescription>Update delivery, payment, and operational status.</DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
                await updateOrder.mutateAsync({
                  deliveryFee: Number(payload.deliveryFee || 0),
                  discount: Number(payload.discount || 0),
                  status: payload.status,
                  paymentStatus: payload.paymentStatus,
                  deliveryNotes: payload.deliveryNotes || undefined,
                  deliveryAddress: {
                    street: payload.street,
                    city: payload.city,
                    state: payload.state,
                    phone: payload.phone,
                    landmark: payload.landmark || undefined,
                  },
                });
                query.refetch();
                setEditing(false);
              }}
            >
              <div className="space-y-1.5"><Label>Street</Label><Input name="street" defaultValue={order.deliveryAddress.street} required /></div>
              <div className="space-y-1.5"><Label>City</Label><Input name="city" defaultValue={order.deliveryAddress.city} required /></div>
              <div className="space-y-1.5"><Label>State</Label><Input name="state" defaultValue={order.deliveryAddress.state} required /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" defaultValue={order.deliveryAddress.phone} required /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Landmark</Label><Input name="landmark" defaultValue={order.deliveryAddress.landmark} /></div>
              <div className="space-y-1.5"><Label>Delivery fee</Label><Input name="deliveryFee" type="number" defaultValue={order.deliveryFee} /></div>
              <div className="space-y-1.5"><Label>Discount</Label><Input name="discount" type="number" defaultValue={order.discount} /></div>
              <div className="space-y-1.5"><Label>Status</Label><select name="status" defaultValue={order.status} className="h-9 w-full rounded-md border bg-background px-2 text-sm">{["pending", "confirmed", "processing", "packed", "picked_up", "in_transit", "delivered", "cancelled", "returned", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
              <div className="space-y-1.5"><Label>Payment</Label><select name="paymentStatus" defaultValue={order.paymentStatus} className="h-9 w-full rounded-md border bg-background px-2 text-sm">{["unpaid", "pending", "successful", "failed", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Delivery notes</Label><textarea name="deliveryNotes" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" /></div>
              <div className="flex justify-end sm:col-span-2"><Button type="submit" variant="brand" disabled={updateOrder.isPending}>{updateOrder.isPending ? <HookLoader size="button" label="Saving..." /> : "Save changes"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
