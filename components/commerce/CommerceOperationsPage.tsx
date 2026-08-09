"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";

type RecordRow = Record<string, unknown> & {
  id?: string;
  publicId?: string;
  createdAt?: string;
};
type Settings = {
  podEnabled: boolean;
  defaultDeliveryFeeMinor: number;
  defaultPodLimitMinor: number;
  previewTtlMinutes: number;
};

function moneyMinor(value: unknown) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0) / 100);
}

function RecordTable({
  rows,
  kind,
  onPodAction,
}: {
  rows: RecordRow[];
  kind: "pod" | "payments" | "exceptions" | "outbox";
  onPodAction?: (id: string, action: "call" | "approve" | "prepay") => void;
}) {
  if (!rows.length)
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        No records in this view.
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Context</TableHead>
          <TableHead>Created</TableHead>
          {kind === "pod" ? (
            <TableHead className="text-right">Actions</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const id = String(row.publicId || row.id || `${kind}-${index}`);
          const status = String(
            row.commerceStatus ||
              row.processingStatus ||
              row.status ||
              "pending",
          );
          const context =
            kind === "payments"
              ? moneyMinor(row.amountMinor)
              : kind === "pod"
                ? `${moneyMinor(row.totalMinor)} · ${String(row.channel || "SHOPPER_APP")}`
                : String(
                    row.type || row.eventType || row.provider || "Commerce",
                  );
          return (
            <TableRow key={id}>
              <TableCell className="font-medium">{id}</TableCell>
              <TableCell>
                <Badge variant="secondary">{status.replaceAll("_", " ")}</Badge>
              </TableCell>
              <TableCell>{context}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
              </TableCell>
              {kind === "pod" ? (
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPodAction?.(id, "call")}
                    >
                      Confirm call
                    </Button>
                    <Button
                      size="sm"
                      variant="brand"
                      onClick={() => onPodAction?.(id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onPodAction?.(id, "prepay")}
                    >
                      Require payment
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function CommerceOperationsPage({
  view,
}: {
  view: "pod" | "payments" | "settings";
}) {
  const queryClient = useQueryClient();
  const pod = useApiQuery<RecordRow[]>(
    ["commerce", "pod"],
    "/admin/commerce/pod",
    view === "pod",
  );
  const payments = useApiQuery<RecordRow[]>(
    ["commerce", "payments"],
    "/admin/commerce/payments",
    view === "payments",
  );
  const exceptions = useApiQuery<RecordRow[]>(
    ["commerce", "exceptions"],
    "/admin/commerce/integration-exceptions",
    view === "payments",
  );
  const outbox = useApiQuery<RecordRow[]>(
    ["commerce", "outbox"],
    "/admin/commerce/outbox",
    view === "payments",
  );
  const settings = useApiQuery<Settings>(
    ["commerce", "settings"],
    "/admin/commerce/settings",
    view === "settings",
  );
  const update = useApiPatch<Settings, Settings>(
    "/admin/commerce/settings",
    ["commerce", "settings"],
    { successMessage: "Commerce settings updated" },
  );
  const [draft, setDraft] = useState<Settings | null>(null);
  const form = draft || settings.data;
  const current = useMemo(
    () => (view === "pod" ? pod : payments),
    [payments, pod, view],
  );
  async function podAction(id: string, action: "call" | "approve" | "prepay") {
    try {
      if (action === "call")
        await apiPost(`/admin/commerce/pod/${id}/calls`, {
          outcome: "CONFIRMED",
          notes: "Customer confirmation completed by Operations.",
        });
      else
        await apiPost(`/admin/commerce/pod/${id}/decision`, {
          decision: action === "approve" ? "APPROVE" : "PREPAYMENT_REQUIRED",
          reason:
            action === "approve"
              ? "Operations approved after customer confirmation."
              : "Operations requires secure prepayment before fulfilment.",
        });
      toast.success(
        action === "call"
          ? "Confirmation call recorded"
          : "POD decision recorded",
      );
      await queryClient.invalidateQueries({ queryKey: ["commerce", "pod"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "POD action failed");
    }
  }
  if (current.isLoading || (view === "settings" && settings.isLoading))
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <HookLoader size="page" label="Loading commerce operations" />
      </div>
    );

  if (view === "settings")
    return (
      <div className="w-full space-y-5 px-4 py-5">
        <PageHeader
          title="Commerce Settings"
          description="Super Admin controls for checkout policy and Pay-at-Handover eligibility."
        />
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Checkout defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {form ? (
              <>
                <div className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <Label>Pay at Handover</Label>
                    <p className="text-sm text-muted-foreground">
                      Global capability switch. State and zone rules still
                      apply.
                    </p>
                  </div>
                  <Switch
                    checked={form.podEnabled}
                    onCheckedChange={(value) =>
                      setDraft({ ...form, podEnabled: value })
                    }
                  />
                </div>
                {[
                  [
                    "Default delivery fee (minor units)",
                    "defaultDeliveryFeeMinor",
                  ],
                  ["Default POD limit (minor units)", "defaultPodLimitMinor"],
                  ["Preview lifetime (minutes)", "previewTtlMinutes"],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      value={form[key as keyof Settings] as number}
                      onChange={(event) =>
                        setDraft({ ...form, [key]: Number(event.target.value) })
                      }
                    />
                  </div>
                ))}
                <Button
                  variant="brand"
                  disabled={update.isPending}
                  onClick={() => update.mutate(form)}
                >
                  {update.isPending ? "Saving..." : "Save settings"}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title={
          view === "pod"
            ? "POD Verification Queue"
            : "Payments & Reconciliation"
        }
        description={
          view === "pod"
            ? "Review confirmation calls, eligibility, and high-value approvals before fulfilment."
            : "Monitor Paystack evidence, exceptions, and fulfilment outbox delivery."
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => current.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />
      {view === "pod" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Pending verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RecordTable
              rows={pod.data || []}
              kind="pod"
              onPodAction={podAction}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Exceptions
            </TabsTrigger>
            <TabsTrigger value="outbox">
              <ExternalLink className="mr-2 h-4 w-4" />
              Outbox
            </TabsTrigger>
          </TabsList>
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                <RecordTable rows={payments.data || []} kind="payments" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="exceptions">
            <Card>
              <CardContent className="p-0">
                <RecordTable rows={exceptions.data || []} kind="exceptions" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="outbox">
            <Card>
              <CardContent className="p-0">
                <RecordTable rows={outbox.data || []} kind="outbox" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
