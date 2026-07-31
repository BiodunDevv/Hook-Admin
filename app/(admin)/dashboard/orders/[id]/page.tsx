"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApiQuery } from "@/lib/query";

type OrderDetail = {
  id: string;
  publicId?: string;
  orderCode?: string;
  channel?: string;
  sourceStateId?: string;
  commerceStatus?: string;
  commercePaymentStatus?: string;
  commercePaymentMethod?: string;
  deliveryMethod?: string;
  subtotalMinor?: number;
  deliveryFeeMinor?: number;
  totalMinor?: number;
  currency?: string;
  customerSnapshot?: Record<string, unknown>;
  addressSnapshot?: Record<string, unknown>;
  pickupPartnerSnapshot?: Record<string, unknown>;
  items?: Array<{
    id: string;
    publicId?: string;
    quantity: number;
    unitPriceMinor?: number;
    totalPriceMinor?: number;
    productSnapshot?: Record<string, unknown>;
    variantSnapshot?: Record<string, unknown>;
    quoteSnapshot?: Record<string, unknown>;
  }>;
  payment?: {
    publicId?: string;
    commerceStatus?: string;
    gateway?: string;
    transactionRef?: string;
    amountMinor?: number;
  };
  timeline?: Array<{
    status?: string;
    at?: string;
    actorType?: string;
    reason?: string;
  }>;
  podReview?: Record<string, unknown>;
  policyVersions?: Record<string, string>;
};

const money = (value: unknown) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0) / 100);
const text = (value: unknown) => String(value || "-");

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<OrderDetail>(
    ["admin", "orders", id],
    `/admin/orders/${id}`,
    Boolean(id),
  );
  const order = query.data;
  if (query.isLoading)
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <HookLoader size="page" label="Loading Order" />
      </div>
    );
  if (!order)
    return (
      <div className="p-6">
        <PageHeader
          title="Order unavailable"
          description="This Order could not be loaded in your current operational scope."
        />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  const customer = order.customerSnapshot || {};
  const address = order.addressSnapshot || order.pickupPartnerSnapshot || {};
  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title={order.publicId || order.orderCode || order.id}
        description={`${text(order.channel).replaceAll("_", " ")} · ${text(order.deliveryMethod).replaceAll("_", " ")}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Order status" value={text(order.commerceStatus)} />
        <Metric
          label="Payment status"
          value={text(order.commercePaymentStatus)}
        />
        <Metric label="State" value={text(order.sourceStateId)} />
        <Metric label="Total" value={money(order.totalMinor)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Immutable line snapshots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.items || []).map((item) => (
                <div
                  key={item.publicId || item.id}
                  className="grid grid-cols-[1fr_auto] gap-4 rounded-md border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {text(item.productSnapshot?.title)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Qty {item.quantity} · {money(item.unitPriceMinor)} each
                    </p>
                    {Object.keys(item.variantSnapshot || {}).length ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Object.entries(item.variantSnapshot || {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                    {item.quoteSnapshot ? (
                      <Badge className="mt-2" variant="secondary">
                        Negotiated quote applied
                      </Badge>
                    ) : null}
                  </div>
                  <p className="font-semibold">{money(item.totalPriceMinor)}</p>
                </div>
              ))}
              {!order.items?.length ? (
                <p className="text-sm text-muted-foreground">
                  No line snapshots found.
                </p>
              ) : null}
              <Separator />
              <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
                <Amount label="Subtotal" value={order.subtotalMinor} />
                <Amount label="Delivery" value={order.deliveryFeeMinor} />
                <Amount label="Total" value={order.totalMinor} strong />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Order timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(order.timeline || []).map((event, index) => (
                <div
                  key={`${event.status}-${event.at}-${index}`}
                  className="flex gap-3"
                >
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-brand-gold" />
                  <div>
                    <p className="font-medium">
                      {text(event.status).replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.at ? new Date(event.at).toLocaleString() : "-"} ·{" "}
                      {text(event.actorType)}
                    </p>
                    {event.reason ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.reason}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Customer & policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Customer" value={customer.name} />
              <Info label="Email" value={customer.email} />
              <Info label="Phone" value={customer.phone} />
              <Info
                label="Policy versions"
                value={Object.entries(order.policyVersions || {})
                  .map(([key, value]) => `${key} ${value}`)
                  .join(" · ")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info
                label="Recipient"
                value={address.recipientName || address.name}
              />
              <Info label="Address" value={address.line1 || address.address} />
              <Info
                label="Phone"
                value={
                  address.phone ||
                  (address.contact as Record<string, unknown> | undefined)
                    ?.phone
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Method" value={order.commercePaymentMethod} />
              <Info
                label="Provider"
                value={order.payment?.gateway || "paystack"}
              />
              <Info label="Reference" value={order.payment?.transactionRef} />
              <StatusBadge
                status={
                  order.payment?.commerceStatus ||
                  order.commercePaymentStatus ||
                  "PENDING"
                }
              />
              {order.podReview ? (
                <div className="rounded-md bg-muted p-3 text-xs">
                  POD review: {JSON.stringify(order.podReview)}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 truncate text-lg font-semibold">
          {value.replaceAll("_", " ")}
        </p>
      </CardContent>
    </Card>
  );
}
function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{text(value)}</p>
    </div>
  );
}
function Amount({
  label,
  value,
  strong,
}: {
  label: string;
  value: unknown;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "text-base font-semibold" : ""}`}
    >
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}
