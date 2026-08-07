"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, Trash2, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { HookLoader } from "@/components/shared/HookLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet, apiPatch, apiPost, apiRequest } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "sonner";

type Row = Record<string, unknown> & { publicId?: string; id?: string };
type SelectedCustomer = Row & { publicId: string; email?: string; firstName?: string; lastName?: string };
type BasketItem = Row & {
  publicId?: string;
  quantity?: number;
  totalPriceMinor?: number;
  product?: Row & { title?: string; images?: string[] };
};
type StateGroup = {
  stateId: string;
  subtotalMinor: number;
  checkoutEligible: boolean;
  blockingReasons?: string[];
  itemIds?: string[];
  items?: BasketItem[];
};
type AssistedBasket = {
  items?: BasketItem[];
  itemCount: number;
  subtotalMinor: number;
  stateGroups: StateGroup[];
};
type CheckoutPreview = {
  previewToken: string;
  totalMinor: number;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  expiresAt: string;
};

const SELECTED_CUSTOMER_KEY = "hook_partner_selected_customer";

export function PartnerCommerceWorkspace({
  view,
}: {
  view: "browse" | "customers" | "basket" | "orders";
}) {
  const queryClient = useQueryClient();
  const products = useApiQuery<{ data: Row[] }>(
    ["partner", "catalog"],
    "/public/products?limit=30",
    view === "browse",
  );
  const orders = useApiQuery<Row[]>(
    ["partner", "orders"],
    "/partner/orders",
    view === "orders",
  );
  const config = useApiQuery<{ policyVersions: Record<string, string> }>(
    ["partner", "commerce-config"],
    "/partner/commerce/config",
    view === "customers" || view === "basket",
  );
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState<Row | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);
  const [checkoutStateId, setCheckoutStateId] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = localStorage.getItem(SELECTED_CUSTOMER_KEY);
      if (!raw) return;
      try {
        setSelectedCustomer(JSON.parse(raw) as SelectedCustomer);
      } catch {
        localStorage.removeItem(SELECTED_CUSTOMER_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const basket = useApiQuery<AssistedBasket>(
    ["partner", "basket", selectedCustomer?.publicId],
    selectedCustomer
      ? `/partner/customers/${selectedCustomer.publicId}/cart`
      : "/partner/customers/none/cart",
    view === "basket" && Boolean(selectedCustomer),
  );

  function selectCustomer(value: Row) {
    const publicId = String(value.publicId || value.id || "");
    if (!publicId) {
      toast.error("This customer does not have a valid Hook ID");
      return;
    }
    const selected = { ...value, publicId } as SelectedCustomer;
    localStorage.setItem(SELECTED_CUSTOMER_KEY, JSON.stringify(selected));
    setSelectedCustomer(selected);
    queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
    toast.success("Customer selected for assisted shopping");
  }

  async function addProduct(product: Row) {
    if (!selectedCustomer) {
      toast.info("Select a customer before adding products");
      return;
    }
    const productId = String(product.publicId || product.id || "");
    if (!productId) return;
    setBusyItem(productId);
    try {
      await apiPost(`/partner/customers/${selectedCustomer.publicId}/cart/items`, {
        productId,
        quantity: 1,
      });
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
      toast.success("Product added to the assisted basket");
    } finally {
      setBusyItem(null);
    }
  }

  async function changeQuantity(item: BasketItem, quantity: number) {
    if (!selectedCustomer || !item.publicId || quantity < 1) return;
    setBusyItem(item.publicId);
    try {
      await apiPatch(
        `/partner/customers/${selectedCustomer.publicId}/cart/items/${item.publicId}`,
        { quantity },
      );
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
    } finally {
      setBusyItem(null);
    }
  }

  async function removeItem(item: BasketItem) {
    if (!selectedCustomer || !item.publicId) return;
    setBusyItem(item.publicId);
    try {
      await apiRequest(
        `/partner/customers/${selectedCustomer.publicId}/cart/items/${item.publicId}`,
        { method: "DELETE" },
      );
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
      toast.success("Product removed from the assisted basket");
    } finally {
      setBusyItem(null);
    }
  }

  async function prepareCheckout(group: StateGroup) {
    if (!selectedCustomer) return;
    const policyVersions = config.data?.policyVersions || {};
    if (!policyVersions.TERMS || !policyVersions.PRIVACY || !policyVersions.RETURNS) {
      toast.error("Current Hook policies are unavailable");
      return;
    }
    setCheckoutBusy(true);
    try {
      const preview = await apiPost<CheckoutPreview>(
        `/partner/customers/${selectedCustomer.publicId}/checkout/states/${group.stateId}/preview`,
        {
          deliveryMethod: "PARTNER_PICKUP",
          paymentMethod: "PREPAID",
          policyVersions,
        },
      );
      setCheckoutStateId(group.stateId);
      setCheckoutPreview(preview);
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function confirmCheckout() {
    if (!selectedCustomer || !checkoutPreview || !checkoutStateId) return;
    setCheckoutBusy(true);
    try {
      const order = await apiRequest<Row>(
        `/partner/customers/${selectedCustomer.publicId}/checkout/states/${checkoutStateId}/confirm`,
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ previewToken: checkoutPreview.previewToken }),
        },
      );
      const orderId = String(order.publicId || order.id || "");
      const payment = await apiPost<Row>(`/partner/orders/${orderId}/payment-instructions`);
      const authorizationUrl = String(payment.authorizationUrl || "");
      setCheckoutPreview(null);
      setCheckoutStateId(null);
      await queryClient.invalidateQueries({ queryKey: ["partner", "basket"] });
      await queryClient.invalidateQueries({ queryKey: ["partner", "orders"] });
      if (authorizationUrl) window.open(authorizationUrl, "_blank", "noopener,noreferrer");
      toast.success("Order created. Share the Paystack checkout with the customer.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiGet<{ found: boolean; customer?: Row }>(
        `/partner/customers/lookup?email=${encodeURIComponent(email)}`,
      );
      setCustomer(result.customer || null);
      if (!result.found)
        toast.info(
          "No exact customer match. Create an assisted customer after confirming consent.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const policyVersions = config.data?.policyVersions || {};
      if (!policyVersions.TERMS || !policyVersions.PRIVACY || !policyVersions.RETURNS)
        throw new Error("Current Hook policies are unavailable");
      const result = await apiPost<Row>("/partner/customers", {
        ...form,
        policyVersions,
      });
      setCustomer(result);
      selectCustomer(result);
      toast.success(
        "Customer created for assisted ordering. Direct login remains disabled until verification.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    (view === "browse" && products.isLoading) ||
    (view === "orders" && orders.isLoading)
  )
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <HookLoader size="page" label="Loading Partner commerce" />
      </div>
    );
  if (view === "browse")
    return (
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Browse Hook</h1>
          <p className="text-muted-foreground">
            Approved Hook catalog. Customers always pay Hook directly.
          </p>
        </div>
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Shopping for</p>
              <p className="truncate text-sm font-medium">
                {`${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim() || selectedCustomer.email}
              </p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href="/partner/basket">View basket</Link></Button>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products.data?.data || []).map((product) => (
            <Card key={String(product.publicId || product.id)}>
              <CardContent className="space-y-3 p-4">
                <Badge variant="secondary">Published</Badge>
                <h2 className="font-semibold">
                  {String(product.title || "Product")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(Number(product.effectivePriceMinor || 0) / 100)}
                </p>
                <Button
                  className="w-full"
                  variant="brand"
                  disabled={busyItem === String(product.publicId || product.id)}
                  onClick={() => addProduct(product)}
                >
                  {busyItem === String(product.publicId || product.id) ? <HookLoader size="button" /> : "Add to basket"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  if (view === "orders")
    return (
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Assisted Orders</h1>
          <p className="text-muted-foreground">
            Only Orders initiated at this Partner location are visible.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders.data || []).map((order) => (
                  <TableRow key={String(order.publicId || order.id)}>
                    <TableCell>{String(order.publicId)}</TableCell>
                    <TableCell>{String(order.commerceStatus)}</TableCell>
                    <TableCell>{String(order.commercePaymentStatus)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(Number(order.totalMinor || 0) / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    );
  if (view === "basket")
    return (
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Assisted Basket</h1>
          <p className="text-muted-foreground">
            Start from an exact customer lookup. Partner checkout is prepaid and
            can use home delivery or this location for pickup.
          </p>
        </div>
        {!selectedCustomer ? (
          <Card><CardContent className="space-y-4 p-6"><p className="text-sm">Select an exact customer before starting an assisted basket.</p><Button asChild variant="brand"><Link href="/partner/customers">Select customer</Link></Button></CardContent></Card>
        ) : basket.isLoading ? (
          <div className="flex min-h-72 items-center justify-center"><HookLoader size="page" label="Loading assisted basket" /></div>
        ) : !(basket.data?.stateGroups || []).length ? (
          <Card><CardContent className="space-y-4 p-6"><p className="font-medium">The assisted basket is empty</p><p className="text-sm text-muted-foreground">Add approved products for {selectedCustomer.firstName || selectedCustomer.email}. Prices always come from Hook.</p><Button asChild variant="brand"><Link href="/partner/browse">Browse Hook</Link></Button></CardContent></Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border bg-background px-4 py-3"><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{`${selectedCustomer.firstName || ""} ${selectedCustomer.lastName || ""}`.trim()}</p></div><Badge variant="secondary">{basket.data?.itemCount || 0} items</Badge></div>
            {basket.data?.stateGroups.map((group) => {
              const groupItems = getBasketGroupItems(basket.data, group);
              return (
              <Card key={group.stateId}>
                <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">State basket</CardTitle><p className="text-xs text-muted-foreground">{group.stateId}</p></div><p className="font-semibold">{money(group.subtotalMinor)}</p></CardHeader>
                <CardContent className="space-y-3">
                  {groupItems.map((item) => (
                    <div key={String(item.publicId || item.id)} className="flex items-center gap-3 border-t pt-3 first:border-0 first:pt-0">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{String(item.product?.title || "Product")}</p><p className="text-xs text-muted-foreground">{money(Number(item.unitPriceMinor || 0))} each · {money(Number(item.totalPriceMinor || 0))} line total</p></div>
                      <div className="flex items-center gap-1"><Button size="icon-sm" variant="outline" aria-label="Decrease quantity" disabled={busyItem === item.publicId || Number(item.quantity || 1) <= 1} onClick={() => changeQuantity(item, Number(item.quantity || 1) - 1)}><Minus /></Button><span className="w-7 text-center text-sm">{item.quantity || 1}</span><Button size="icon-sm" variant="outline" aria-label="Increase quantity" disabled={busyItem === item.publicId} onClick={() => changeQuantity(item, Number(item.quantity || 1) + 1)}><Plus /></Button><Button size="icon-sm" variant="ghost" aria-label="Remove product" disabled={busyItem === item.publicId} onClick={() => removeItem(item)}><Trash2 /></Button></div>
                    </div>
                  ))}
                  {!group.checkoutEligible ? <p className="text-xs text-destructive">This group needs attention before checkout: {(group.blockingReasons || []).join(", ")}</p> : null}
                  <Button className="w-full" variant="brand" disabled={!group.checkoutEligible || checkoutBusy} onClick={() => prepareCheckout(group)}>{checkoutBusy ? <HookLoader size="button" /> : "Continue to prepaid checkout"}</Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
        <Dialog open={Boolean(checkoutPreview)} onOpenChange={(open) => !open && !checkoutBusy && setCheckoutPreview(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Partner-assisted Order</DialogTitle><DialogDescription>This creates one prepaid pickup Order. The customer pays Hook directly through Paystack.</DialogDescription></DialogHeader>
            {checkoutPreview ? <div className="space-y-2 rounded-md border p-4 text-sm"><div className="flex justify-between"><span>Products</span><span>{money(checkoutPreview.subtotalMinor)}</span></div><div className="flex justify-between"><span>Pickup fee</span><span>{money(checkoutPreview.deliveryFeeMinor)}</span></div><div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{money(checkoutPreview.totalMinor)}</span></div></div> : null}
            <DialogFooter><Button variant="outline" disabled={checkoutBusy} onClick={() => setCheckoutPreview(null)}>Cancel</Button><Button variant="brand" disabled={checkoutBusy} onClick={confirmCheckout}>{checkoutBusy ? <HookLoader size="button" /> : "Create Order"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    );
  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Customer Lookup</h1>
        <p className="text-muted-foreground">
          Use an exact email. Customer attestation does not verify email or
          enable direct login.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={lookup} className="flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="customer@example.com"
              />
              <Button disabled={busy}>Find</Button>
            </form>
            {customer ? (
              <div className="mt-4 rounded-md border p-4">
                <p className="font-medium">
                  {String(customer.firstName || "")}{" "}
                  {String(customer.lastName || "")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {String(customer.email || "")}
                </p>
                <Badge className="mt-2" variant="secondary">
                  {customer.emailVerified
                    ? "Verified"
                    : "Verification required"}
                </Badge>
                <Button className="mt-3 w-full" variant="brand" onClick={() => selectCustomer(customer)}>Use for assisted shopping</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create assisted customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              {(["firstName", "lastName", "email", "phone"] as const).map(
                (key) => (
                  <div key={key} className="space-y-1">
                    <Label>{key.replace(/([A-Z])/g, " $1")}</Label>
                    <Input
                      required
                      type={key === "email" ? "email" : "text"}
                      value={form[key]}
                      onChange={(event) =>
                        setForm({ ...form, [key]: event.target.value })
                      }
                    />
                  </div>
                ),
              )}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={form.consent}
                  onCheckedChange={(value) =>
                    setForm({ ...form, consent: value === true })
                  }
                />
                <Label htmlFor="consent" className="leading-5">
                  Customer consent and current Hook policies were presented and
                  accepted.
                </Label>
              </div>
              <Button variant="brand" disabled={busy || !form.consent}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Create customer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function getBasketGroupItems(
  basket: AssistedBasket | undefined,
  group: StateGroup,
): BasketItem[] {
  if (group.items?.length) return group.items;
  const ids = new Set((group.itemIds || []).map(String));
  return (basket?.items || []).filter((item) =>
    ids.has(String(item.publicId || item.id || "")),
  );
}

function money(value = 0) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(value / 100);
}
