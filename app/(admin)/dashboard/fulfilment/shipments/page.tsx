"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { ListRow, initialsOf } from "@/components/shared/ListRow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPatch, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Shipment = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  provider?: string;
  /** The courier the customer chose and paid for, e.g. GIG / GUO / DHL. */
  courierCode?: string;
  courierName?: string;
  substitutedFrom?: string;
  substitutionReason?: string;
  trackingNumber?: string;
  status?: string;
  version?: number;
  hub?: { name?: string } | null;
  order?: { publicId?: string } | null;
};

type Consolidation = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  hubId?: string;
  status?: string;
  hub?: { name?: string } | null;
  order?: { publicId?: string } | null;
  chosenCourier?: { code?: string; name?: string; feeMinor?: number };
};

type Courier = { code?: string; name?: string };

type LogisticsReadiness = {
  providers?: Array<{ name: string; enabled: boolean; mode: string; reason?: string }>;
};

const label = (value?: string) => String(value || "-").replaceAll("_", " ");
const rowId = (row: Shipment | Consolidation, index: number, prefix: string) =>
  row.publicId || row.id || row._id || `${prefix}-${index}`;

const nextStatuses: Record<string, string[]> = {
  BOOKED_WITH_PROVIDER: ["AWAITING_PICKUP", "CANCELLED"],
  AWAITING_PICKUP: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "DELIVERY_FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERY_FAILED", "RETURN_IN_TRANSIT"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED", "AWAITING_HANDOVER_PAYMENT"],
  AWAITING_HANDOVER_PAYMENT: ["RELEASE_APPROVED"],
  RELEASE_APPROVED: ["DELIVERED"],
  DELIVERY_FAILED: ["RETURN_IN_TRANSIT"],
  RETURN_IN_TRANSIT: ["RETURNED_TO_HOOK"],
};

export default function FulfilmentShipmentsPage() {
  const shipmentsQuery = useApiQuery<Shipment[]>(
    ["admin", "fulfilment", "shipments"],
    "/admin/fulfilment/shipments?limit=100",
  );
  const consolidationsQuery = useApiQuery<Consolidation[]>(
    ["admin", "fulfilment", "sealed-consolidations"],
    "/admin/fulfilment/consolidations?status=SEALED&limit=100",
  );
  // The admin-managed courier list — the same options the customer picked from
  // at checkout, used here only when substituting.
  const couriersQuery = useApiQuery<{ data?: Courier[] } | Courier[]>(
    ["admin", "logistics-providers"],
    "/admin/logistics-providers?limit=100",
  );
  const readinessQuery = useApiQuery<LogisticsReadiness>(
    ["admin", "fulfilment", "logistics-readiness"],
    "/admin/fulfilment/logistics/readiness",
  );

  // The booking adapter stays 'manual' — couriers are chosen separately below.
  const [provider] = useState<Record<string, string>>({});
  // Substituting is deliberate: staff pick a different courier and say why.
  const [substituteCode, setSubstituteCode] = useState<Record<string, string>>({});
  const [substituteReason, setSubstituteReason] = useState<Record<string, string>>({});
  // The status each row's dropdown is currently showing. Choosing one no
  // longer fires the transition on its own — that made the neighbouring
  // Advance button look decorative and moved real shipments on a stray click.
  const [chosenStatus, setChosenStatus] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<{ shipment: Shipment; status: string }>();
  const [pending, setPending] = useState<string>();

  const couriers = useMemo(() => {
    const raw = couriersQuery.data;
    return (Array.isArray(raw) ? raw : raw?.data || []) as Courier[];
  }, [couriersQuery.data]);
  const shipments = useMemo(() => shipmentsQuery.data || [], [shipmentsQuery.data]);
  const unbooked = useMemo(() => {
    const bookedOrders = new Set(shipments.map((item) => item.orderId));
    return (consolidationsQuery.data || []).filter(
      (item) => item.orderId && !bookedOrders.has(item.orderId),
    );
  }, [consolidationsQuery.data, shipments]);

  const loading =
    shipmentsQuery.isLoading || consolidationsQuery.isLoading || readinessQuery.isLoading;
  const error = shipmentsQuery.error || consolidationsQuery.error || readinessQuery.error;

  function retryAll() {
    void shipmentsQuery.refetch();
    void consolidationsQuery.refetch();
    void readinessQuery.refetch();
  }

  async function book(item: Consolidation) {
    if (!item.orderId || !item.hubId) return;
    const id = item.publicId || item.id || item._id;
    if (!id) return;
    setPending(`book-${id}`);
    try {
      await apiPost(`/admin/fulfilment/orders/${item.orderId}/shipments`, {
        provider: provider[id] || "manual",
        // Book with what the customer actually paid for unless staff have
        // deliberately switched courier.
        courierCode: substituteCode[id] || item.chosenCourier?.code,
        ...(substituteCode[id] && substituteReason[id]?.trim()
          ? { substitutionReason: substituteReason[id].trim() }
          : {}),
        hubId: item.hubId,
        idempotencyKey: `shipment-${item.orderId}`,
      });
      toast.success("Shipment booked.");
      await Promise.all([shipmentsQuery.refetch(), consolidationsQuery.refetch()]);
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message.replace(/^\d+:\s*/, "")
          : "The shipment could not be booked.",
      );
    } finally {
      setPending(undefined);
    }
  }

  async function advance() {
    if (!confirming) return;
    const { shipment, status } = confirming;
    const id = shipment.publicId || shipment.id || shipment._id;
    if (!id) return;
    setPending(`status-${id}`);
    try {
      await apiPatch(`/admin/fulfilment/shipments/${id}`, {
        status,
        version: shipment.version,
      });
      toast.success(`Shipment advanced to ${label(status)}.`);
      setConfirming(undefined);
      await shipmentsQuery.refetch();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message.replace(/^\d+:\s*/, "")
          : "The shipment status could not be changed.",
      );
    } finally {
      setPending(undefined);
    }
  }


  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Shipments"
        description="Book sealed parcels through the controlled manual logistics path and advance status only through valid transitions. GIG and Fez remain disabled until verified."
      />

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Ready for booking</CardTitle>
          <Badge variant="outline">{unbooked.length} waiting</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={loading}
            error={error}
            empty={unbooked.length === 0}
            loadingLabel="Loading shipments"
            errorTitle="Shipment operations could not be loaded"
            emptyTitle="Nothing waiting for booking"
            emptyDescription="Sealed parcels appear here once the hub has consolidated them."
            emptyIcon={Truck}
            onRetry={retryAll}
          >
            {unbooked.map((item, index) => {
              const id = rowId(item, index, "consolidation");
              const orderRef = item.order?.publicId || item.orderId;
              const substituting = Boolean(substituteCode[id]);
              return (
                <div key={id} className="border-t border-zinc-100 first:border-t-0">
                  <ListRow
                    index={index + 1}
                    initials={initialsOf(item.chosenCourier?.name || "courier")}
                    title={
                      <span className="truncate text-sm font-semibold text-zinc-950">
                        {orderRef}
                      </span>
                    }
                    subject={item.chosenCourier?.name || "No courier recorded"}
                    meta={[
                      `Sealed ${id}`,
                      item.hub?.name || `Hub ${item.hubId}`,
                      substituting ? "substituting courier" : undefined,
                    ]}
                    actions={
                      <PermissionGuard permission="logistics.book">
                        <Button
                          size="sm"
                          onClick={() => void book(item)}
                          disabled={
                            pending === `book-${id}` ||
                            Boolean(substituteCode[id] && !substituteReason[id]?.trim())
                          }
                        >
                          {pending === `book-${id}` ? (
                            <HookLoader size="button" />
                          ) : (
                            <>
                              <Truck /> Book shipment
                            </>
                          )}
                        </Button>
                      </PermissionGuard>
                    }
                  />

                  {/* Substitution is opt-in and sits below the row so the
                      default path — book what the customer paid for — stays a
                      single click. Switching demands a reason, which is stored
                      and shown to the customer in the app. */}
                  <div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:flex-row sm:items-center xl:px-5">
                    <Select
                      value={substituteCode[id] || "__chosen__"}
                      onValueChange={(value) =>
                        setSubstituteCode((current) => {
                          const next = { ...current };
                          if (value === "__chosen__") delete next[id];
                          else next[id] = value;
                          return next;
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-full sm:w-[240px]">
                        <SelectValue placeholder="Courier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__chosen__">
                          {item.chosenCourier?.name || "Customer's courier"}
                        </SelectItem>
                        {(couriers || [])
                          .filter((courier: Courier) => courier.code !== item.chosenCourier?.code)
                          .map((courier: Courier) => (
                            <SelectItem key={courier.code} value={String(courier.code)}>
                              {courier.name} (substitute)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {substituting ? (
                      <Input
                        value={substituteReason[id] || ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          setSubstituteReason((current) => ({ ...current, [id]: event.target.value }))
                        }
                        placeholder="Why the change? (shown to the customer)"
                        className="h-9 flex-1 text-xs"
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </QueryState>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Shipment register</CardTitle>
          <Badge variant="outline">{shipments.length} shipments</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={loading}
            error={error}
            empty={shipments.length === 0}
            loadingLabel="Loading shipments"
            errorTitle="Shipment operations could not be loaded"
            emptyTitle="No shipments recorded"
            emptyDescription="Booked shipments and their tracking appear here."
            emptyIcon={Truck}
            onRetry={retryAll}
          >
            {shipments.map((item, index) => {
              const id = rowId(item, index, "shipment");
              const options = nextStatuses[item.status || ""] || [];
              const selected = chosenStatus[id] || options[0] || "";
              const orderRef = item.order?.publicId || item.orderId;

              return (
                <ListRow
                  key={id}
                  index={index + 1}
                  initials={initialsOf(item.courierName || item.provider || "shipment")}
                  title={<span className="truncate text-sm font-semibold text-zinc-950">{id}</span>}
                  subject={item.courierName || item.provider || "manual"}
                  meta={[
                    orderRef ? (
                      <Link href={`/dashboard/orders/${orderRef}`} className="hover:underline">
                        {orderRef}
                      </Link>
                    ) : (
                      "No order reference"
                    ),
                    item.trackingNumber,
                    item.substitutedFrom ? `substituted from ${item.substitutedFrom}` : undefined,
                  ]}
                  actions={
                    <>
                      <StatusBadge status={item.status || "BOOKED_WITH_PROVIDER"} />
                      {options.length ? (
                        <>
                          <Select
                            value={selected}
                            onValueChange={(value) =>
                              setChosenStatus((current) => ({ ...current, [id]: value }))
                            }
                          >
                            <SelectTrigger className="h-8 w-[190px]">
                              <SelectValue placeholder="Advance status" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {label(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <PermissionGuard permission="logistics.manage">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending === `status-${id}` || !selected}
                              onClick={() => setConfirming({ shipment: item, status: selected })}
                            >
                              {pending === `status-${id}` ? (
                                <HookLoader size="button" />
                              ) : (
                                <>
                                  <Check /> Advance
                                </>
                              )}
                            </Button>
                          </PermissionGuard>
                        </>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </QueryState>
        </CardContent>
      </Card>

      {/* Advancing a shipment is reported to the customer and cannot be undone
          from here, so it is confirmed rather than fired on a single click. */}
      <AlertDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => (open ? undefined : setConfirming(undefined))}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Advance {confirming ? rowId(confirming.shipment, 0, "shipment") : "shipment"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Status changes from{" "}
              <span className="font-medium text-foreground">{label(confirming?.shipment.status)}</span>{" "}
              to <span className="font-medium text-foreground">{label(confirming?.status)}</span>. The
              customer is notified of this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Keep the dialog mounted while the request runs so the
                // pending state is visible instead of flashing closed.
                event.preventDefault();
                void advance();
              }}
              disabled={Boolean(pending)}
            >
              {pending ? <HookLoader size="button" variant="yellow" /> : "Advance shipment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
