"use client";

import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiPatch, apiPost } from "@/lib/api";
import { cleanError, type Page } from "@/lib/admin-utils";
import { useAdminSession, useApiQuery } from "@/lib/query";

type RefundStatus = "requested" | "under_review" | "approved" | "rejected" | "provider_pending" | "refunded";
type RefundRequest = {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  reasonType: string;
  status: RefundStatus;
  evidenceUrls?: string[];
  providerReference?: string;
  createdAt: string;
};

const statuses: Array<{ label: string; value: string }> = [
  { label: "All requests", value: "all" },
  { label: "Requested", value: "requested" },
  { label: "Under review", value: "under_review" },
  { label: "Rejected", value: "rejected" },
  { label: "Provider pending", value: "provider_pending" },
  { label: "Refunded", value: "refunded" },
];

export default function RefundsPage() {
  const [status, setStatus] = useState("all");
  const [workingId, setWorkingId] = useState<string>();
  const { data: admin } = useAdminSession();
  const query = useApiQuery<Page<RefundRequest>>(
    ["admin", "refund-requests", status],
    `/admin/financials/refund-requests?limit=50${status === "all" ? "" : `&status=${status}`}`,
  );

  async function review(item: RefundRequest, next: "under_review" | "rejected") {
    setWorkingId(item.id);
    try {
      await apiPatch(`/admin/financials/refund-requests/${item.id}/review`, {
        status: next,
        decisionNote: next === "rejected" ? "Request rejected after support review" : "Assigned for support review",
      });
      toast.success(next === "rejected" ? "Refund request rejected" : "Refund assigned for review");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error));
    } finally {
      setWorkingId(undefined);
    }
  }

  async function approve(item: RefundRequest) {
    if (!window.confirm(`Approve a ${formatMoney(item.amount)} refund for this order? This action contacts the payment provider.`)) return;
    setWorkingId(item.id);
    try {
      await apiPost(`/admin/financials/refund-requests/${item.id}/approve`, { reason: "Approved after operational review" });
      toast.success("Refund submitted and recorded");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error));
    } finally {
      setWorkingId(undefined);
    }
  }

  return (
    <div className="p-2 sm:p-4">
      <PageHeader title="Refund Operations" description="Review eligible disputes and track provider refunds without exceeding captured funds." />
      <div className="mb-3 flex justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Card className="rounded-lg py-0 shadow-card">
        <CardContent className="p-0">
          {query.isLoading && <div className="p-12"><HookLoader label="Loading refund requests..." /></div>}
          {!query.isLoading && !(query.data?.data || []).length && (
            <div className="px-4 py-14 text-center">
              <ShieldCheck className="mx-auto mb-3 text-zinc-300" />
              <p className="font-medium">No refund requests in this view</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">Eligible vendor failures and customer disputes will appear here for controlled review.</p>
            </div>
          )}
          {(query.data?.data || []).map((item) => (
            <div key={item.id} className="border-b p-3 last:border-0 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{formatMoney(item.amount)}</p><StatusBadge status={item.status} /></div>
                  <p className="mt-1 text-sm">Order <span className="font-medium">{item.orderId}</span> · {humanize(item.reasonType)}</p>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500">{item.reason}</p>
                  <p className="mt-1 text-xs text-zinc-400">Requested {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "requested" && <Button size="sm" variant="outline" disabled={workingId === item.id} onClick={() => review(item, "under_review")}>Review</Button>}
                  {["requested", "under_review"].includes(item.status) && <Button size="sm" variant="outline" disabled={workingId === item.id} onClick={() => review(item, "rejected")}>Reject</Button>}
                  {admin?.role === "super_admin" && ["requested", "under_review", "approved"].includes(item.status) && (
                    <Button size="sm" disabled={workingId === item.id} onClick={() => approve(item)}>
                      {workingId === item.id ? <RotateCcw className="animate-spin" /> : "Approve refund"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMoney(value: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
