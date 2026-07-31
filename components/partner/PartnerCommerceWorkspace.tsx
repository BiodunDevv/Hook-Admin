"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Search, ShoppingBag, UserPlus } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { apiGet, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast } from "sonner";

type Row = Record<string, unknown> & { publicId?: string; id?: string };

export function PartnerCommerceWorkspace({
  view,
}: {
  view: "browse" | "customers" | "basket" | "orders";
}) {
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
    view === "customers",
  );
  const [email, setEmail] = useState("");
  const [customer, setCustomer] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consent: false,
  });

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
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm">
              Select a customer in the Customers workspace, then add approved
              catalog items. Partners cannot alter prices or confirm payment.
            </p>
            <Button asChild variant="brand">
              <Link href="/partner/customers">Select customer</Link>
            </Button>
          </CardContent>
        </Card>
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
