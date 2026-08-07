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
import { MetricCard } from "@/components/shared/MetricCard";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-5 pb-10">
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
        <MetricCard icon={Package} label="Order status" value={text(order.commerceStatus).replaceAll("_", " ")} intent="warning" />
        <MetricCard icon={CreditCard} label="Payment status" value={text(order.commercePaymentStatus).replaceAll("_", " ")} intent="success" />
        <MetricCard icon={MapPin} label="Source state" value={text(order.sourceStateId)} />
        <MetricCard icon={ShieldCheck} label="Order total" value={money(order.totalMinor)} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <DetailSection title="Order items" description="Immutable product, variant, quote, and price snapshots captured at checkout." action={<Package className="size-4 text-muted-foreground" />} contentClassName="space-y-3">
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
          </DetailSection>
          <DetailSection title="Order timeline" description="Customer and operations lifecycle events in chronological order." contentClassName="space-y-4">
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
          </DetailSection>
        </div>
        <div className="space-y-5">
          <DetailSection title="Customer & policies" description="Identity and accepted policy versions captured for this order." action={<ShieldCheck className="size-4 text-muted-foreground" />}><DefinitionGrid columns={1} items={[{ label: "Customer", value: text(customer.name) }, { label: "Email", value: text(customer.email) }, { label: "Phone", value: text(customer.phone) }, { label: "Policy versions", value: Object.entries(order.policyVersions || {}).map(([key, value]) => `${key} ${value}`).join(" · ") || "Not recorded" }]} /></DetailSection>
          <DetailSection title="Delivery snapshot" description="Immutable destination information used for fulfilment." action={<MapPin className="size-4 text-muted-foreground" />}><DefinitionGrid columns={1} items={[{ label: "Recipient", value: text(address.recipientName || address.name) }, { label: "Address", value: text(address.line1 || address.address) }, { label: "Phone", value: text(address.phone || (address.contact as Record<string, unknown> | undefined)?.phone) }]} /></DetailSection>
          <DetailSection title="Payment evidence" description="Provider-backed transaction context; status cannot be edited here." action={<CreditCard className="size-4 text-muted-foreground" />}><DefinitionGrid columns={1} items={[{ label: "Method", value: text(order.commercePaymentMethod).replaceAll("_", " ") }, { label: "Provider", value: order.payment?.gateway || "Paystack" }, { label: "Reference", value: text(order.payment?.transactionRef) }, { label: "Status", value: <StatusBadge status={order.payment?.commerceStatus || order.commercePaymentStatus || "PENDING"} /> }, ...(order.podReview ? Object.entries(order.podReview).map(([key, value]) => ({ label: `POD ${key.replace(/([A-Z])/g, " $1")}`, value: text(value) })) : [])]} /></DetailSection>
        </div>
      </div>
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
