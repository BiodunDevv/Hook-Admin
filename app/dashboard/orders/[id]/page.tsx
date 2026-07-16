"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Edit3, MapPin, PackageCheck, ShieldCheck, ShoppingCart, Store, Truck, WalletCards } from "lucide-react";
import { toast } from "sonner";
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
import { apiPost } from "@/lib/api";

interface OrderDetail {
  id: string;
  orderCode: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMode?: string;
  partialFulfilment?: boolean;
  vendorConfirmationDeadline?: string;
  deliveryAddress: { street: string; city: string; state: string; phone: string; landmark?: string };
  user?: { email?: string; firstName?: string; lastName?: string };
  items?: Array<{ id: string; productTitle: string; quantity: number; unitPrice: number; totalPrice: number; productImage?: string }>;
  logistics?: { driverId?: string; driver?: { firstName?: string; lastName?: string; email?: string }; status?: string };
  fulfilments?: Array<{ id: string; vendorId: string; status: string; itemTotal: number; refundAmount: number; confirmationDeadline: string; rejectionReason?: string; vendor?: { businessName?: string } }>;
  escrowLedger?: Array<{ id: string; type: string; amount: number; createdAt: string }>;
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

  async function decideFulfilment(vendorId: string, decision: "confirmed" | "rejected") {
    const reason = decision === "rejected" ? window.prompt("Why can this vendor not fulfil the order?") : undefined;
    if (decision === "rejected" && !reason) return;
    try {
      await apiPost(`/admin/orders/${id}/fulfilments/${vendorId}/${decision}`, {
        reason,
        idempotencyKey: `${decision}-${id}-${vendorId}-${Date.now()}`,
      });
      toast.success(decision === "confirmed" ? "Vendor stock confirmed" : "Vendor items rejected and refund queued");
      query.refetch();
    } catch (error) {
      toast.error(cleanError(error));
    }
  }

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

          <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
            <CardContent className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><Store size={16} /> Vendor stock checks</h3>
                  <p className="mt-1 text-xs text-zinc-500">Each vendor decision controls stock, refunds, and payout eligibility.</p>
                </div>
                <StatusBadge status={order.partialFulfilment ? "partial fulfilment" : order.status} />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {(order.fulfilments || []).map((fulfilment) => (
                  <div key={fulfilment.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium text-zinc-900">{fulfilment.vendor?.businessName || "Vendor fulfilment"}</p><p className="text-xs text-zinc-500">{money(fulfilment.itemTotal)} in items</p></div>
                      <StatusBadge status={fulfilment.status} />
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-xs text-zinc-500"><Clock3 size={13} /> Decision due {new Date(fulfilment.confirmationDeadline).toLocaleString()}</p>
                    {fulfilment.rejectionReason && <p className="mt-2 text-xs text-red-600">{fulfilment.rejectionReason}</p>}
                    {fulfilment.status === "awaiting_confirmation" && <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => decideFulfilment(fulfilment.vendorId, "rejected")}>Reject stock</Button><Button size="sm" variant="brand" onClick={() => decideFulfilment(fulfilment.vendorId, "confirmed")}>Confirm stock</Button></div>}
                  </div>
                ))}
                {!order.fulfilments?.length && <p className="text-sm text-zinc-500">No vendor fulfilment records are attached.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
            <CardContent className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900"><ShieldCheck size={16} /> Payment and escrow history</h3>
              <div className="mb-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-zinc-100 px-2 py-1">Mode: {order.paymentMode?.replaceAll("_", " ") || "pay now"}</span><StatusBadge status={order.paymentStatus} /></div>
              <div className="space-y-2">{(order.escrowLedger || []).map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-sm"><div><p className="font-medium capitalize">{entry.type.replaceAll("_", " ")}</p><p className="text-xs text-zinc-400">{new Date(entry.createdAt).toLocaleString()}</p></div><span className="font-semibold">{money(entry.amount)}</span></div>)}{!order.escrowLedger?.length && <p className="text-sm text-zinc-500">No payment or escrow events yet.</p>}</div>
            </CardContent>
          </Card>

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
                    {["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}
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
              <div className="space-y-1.5"><Label>Status</Label><select name="status" defaultValue={order.status} className="h-9 w-full rounded-md border bg-background px-2 text-sm">{["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
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
