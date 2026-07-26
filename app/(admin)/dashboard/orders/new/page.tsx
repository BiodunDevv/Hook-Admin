"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiPost, useApiQuery } from "@/lib/query";
import { money, type Page } from "@/lib/admin-utils";
import { HookLoader } from "@/components/shared/HookLoader";

interface Customer { id: string; email: string; firstName?: string; lastName?: string; }
interface Product { id: string; title: string; sellingPrice: number; discountedPrice?: number; quantity: number; }
interface Line { productId: string; quantity: number; }

export default function NewOrderPage() {
  const router = useRouter();
  const customers = useApiQuery<Page<Customer>>(["admin", "customers", "options"], "/admin/customers?limit=100");
  const products = useApiQuery<Page<Product>>(["admin", "products", "options"], "/admin/products?limit=100");
  const createOrder = useApiPost<{ id: string }, Record<string, unknown>>("/admin/orders", ["admin", "orders"], { successMessage: "Order created" });
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);

  const productMap = useMemo(() => new Map((products.data?.data || []).map((product) => [product.id, product])), [products.data]);
  const subtotal = lines.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    return sum + Number(product?.discountedPrice || product?.sellingPrice || 0) * Number(line.quantity || 0);
  }, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const order = await createOrder.mutateAsync({
      userId: formData.get("userId"),
      items: lines.filter((line) => line.productId).map((line) => ({ productId: line.productId, quantity: line.quantity })),
      deliveryFee: Number(formData.get("deliveryFee") || 0),
      discount: Number(formData.get("discount") || 0),
      paymentStatus: formData.get("paymentStatus"),
      status: formData.get("status"),
      deliveryNotes: formData.get("deliveryNotes"),
      deliveryAddress: {
        street: formData.get("street"),
        city: formData.get("city"),
        state: formData.get("state"),
        landmark: formData.get("landmark"),
        phone: formData.get("phone"),
      },
    });
    router.push(`/dashboard/orders/${order.id}`);
  }

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title="Create Order" description="Build an order from existing customer and catalog products." actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      <form onSubmit={submit}>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card className="rounded-lg shadow-none">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="userId">Customer</Label>
                <select id="userId" name="userId" required className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="">Select customer</option>
                  {(customers.data?.data || []).map((customer) => (
                    <option key={customer.id} value={customer.id}>{`${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLines((current) => [...current, { productId: "", quantity: 1 }])}><Plus size={14} /> Add</Button>
                </div>
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_36px] gap-2">
                    <select className="h-9 rounded-md border bg-background px-2 text-sm" value={line.productId} onChange={(event) => setLines((current) => current.map((item, idx) => idx === index ? { ...item, productId: event.target.value } : item))}>
                      <option value="">Select product</option>
                      {(products.data?.data || []).map((product) => <option key={product.id} value={product.id}>{product.title} ({product.quantity})</option>)}
                    </select>
                    <Input type="number" min="1" value={line.quantity} onChange={(event) => setLines((current) => current.map((item, idx) => idx === index ? { ...item, quantity: Number(event.target.value) } : item))} />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLines((current) => current.filter((_, idx) => idx !== index) || [{ productId: "", quantity: 1 }])}><Trash2 size={14} /></Button>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["street", "Street"],
                  ["city", "City"],
                  ["state", "State"],
                  ["phone", "Delivery Phone"],
                  ["landmark", "Landmark"],
                  ["deliveryNotes", "Delivery Notes"],
                ].map(([name, label]) => (
                  <div key={name} className="space-y-1.5">
                    <Label htmlFor={name}>{label}</Label>
                    <Input id={name} name={name} required={["street", "city", "state", "phone"].includes(name)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-none">
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1.5"><Label>Delivery Fee</Label><Input name="deliveryFee" type="number" defaultValue="0" /></div>
              <div className="space-y-1.5"><Label>Discount</Label><Input name="discount" type="number" defaultValue="0" /></div>
              <div className="space-y-1.5"><Label>Status</Label><select name="status" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="pending"><option value="pending">Pending</option><option value="confirmed">Confirmed</option></select></div>
              <div className="space-y-1.5"><Label>Payment</Label><select name="paymentStatus" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="unpaid"><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="successful">Successful</option></select></div>
              <div className="rounded-md border bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Subtotal preview</p>
                <p className="text-xl font-semibold">{money(subtotal)}</p>
              </div>
              <Button type="submit" variant="brand" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending ? <HookLoader size="button" label="Creating..." /> : "Create Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
