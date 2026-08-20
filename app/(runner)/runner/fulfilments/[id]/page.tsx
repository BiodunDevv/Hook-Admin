"use client";

import { useState } from "react";
import { ArrowLeft, AlertTriangle, Check, KeyRound, Package, ShoppingBag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton, MobileRow, MobileSection } from "@/components/mobile/MobileUI";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type TaskItem = {
  id?: string;
  _id?: string;
  productSnapshot?: { title?: string };
  productTitle?: string;
  quantity?: number;
};

type Task = {
  id?: string;
  publicId?: string;
  orderId?: string;
  marketId?: string;
  status?: string;
  version?: number;
  items?: TaskItem[];
  package?: { scanCredential?: string };
};

const actions: Record<string, { label: string; action: string }> = {
  ALERTED: { label: "Accept task", action: "accept" },
  ACCEPTED: { label: "Start sourcing", action: "start_sourcing" },
  SOURCING: { label: "Mark product secured", action: "secure" },
  PRODUCT_SECURED: { label: "Begin packing", action: "begin_packing" },
  PACKING: { label: "Pack and create Hub label", action: "pack" },
};

export default function RunnerFulfilmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<Task>(
    ["runner", "fulfilment", params.id],
    `/runner/fulfilments/${params.id}`,
    Boolean(params.id),
  );
  const [pending, setPending] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [credential, setCredential] = useState<string>();
  const [costOpen, setCostOpen] = useState(false);
  const [actualCost, setActualCost] = useState("");

  async function runAction(action: string) {
    setPending(true);
    try {
      const result = await apiPost<Task>(`/runner/fulfilments/${params.id}/${action}`, {
        version: query.data?.version,
        actualCostMinor: action === "secure" ? Math.round(Number(actualCost) * 100) : undefined,
      });
      setCredential(result.package?.scanCredential);
      if (action === "secure") {
        setActualCost("");
        setCostOpen(false);
      }
      await query.refetch();
      toast.success("Task updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Task could not be updated",
      );
    } finally {
      setPending(false);
    }
  }

  async function reportIssue() {
    if (!issue.trim()) return;
    setPending(true);
    try {
      await apiPost(`/runner/fulfilments/${params.id}/issues`, {
        summary: issue.trim(),
        type: "ITEM_UNAVAILABLE",
      });
      await query.refetch();
      setIssue("");
      setIssueOpen(false);
      toast.success("Issue reported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Issue could not be reported",
      );
    } finally {
      setPending(false);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Loading fulfilment task" />
      </div>
    );

  const task = query.data;
  if (!task) return <p className="text-sm text-destructive">This fulfilment task could not be found.</p>;

  const next = task.status ? actions[task.status] : undefined;
  const taskTitle = task.publicId || task.id || params.id || "Fulfilment task";

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
      >
        <ArrowLeft size={15} /> Orders
      </button>

      <div className="mb-6 px-1">
        <h1 className="text-[20px] font-bold leading-tight text-black">{taskTitle}</h1>
        <p className="mt-1 text-[13px] text-[#8F8F8F]">
          Order {task.orderId || "-"} · Market {task.marketId || "-"}
        </p>
        <div className="mt-2.5">
          <StatusBadge status={task.status || "PENDING"} />
        </div>
      </div>

      {credential && (
        <div className="mb-7 rounded-[10px] bg-[#FFF3C4] p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#9a7400]">
            <KeyRound size={14} /> Hub scan credential
          </p>
          <p className="mt-2 font-mono text-[26px] font-bold tracking-[0.25em] text-black">{credential}</p>
          <p className="mt-1.5 text-[12px] text-[#9a7400]">
            Show this once to the Hub officer. It will not be shown again.
          </p>
        </div>
      )}

      <MobileSection title={`Items to collect (${task.items?.length || 0})`}>
        {task.items?.length ? (
          task.items.map((item, index) => (
            <MobileRow
              key={item.id || item._id || index}
              icon={ShoppingBag}
              tone="neutral"
              label={item.productSnapshot?.title || item.productTitle || "Product item"}
              value={`Qty ${item.quantity ?? 1}`}
            />
          ))
        ) : (
          <MobileRow icon={Package} tone="neutral" label="Item details unavailable" />
        )}
      </MobileSection>

      <div className="space-y-3">
        {next ? (
          <MobileButton
            disabled={pending}
            onClick={() => {
              if (next.action === "secure") setCostOpen(true);
              else void runAction(next.action);
            }}
          >
            {pending ? <HookLoader size="button" /> : <><Check size={18} /> {next.label}</>}
          </MobileButton>
        ) : (
          <p className="rounded-[10px] bg-white p-4 text-center text-[13px] text-[#8F8F8F]">
            No action is available in this state.
          </p>
        )}
        <MobileButton variant="outline" onClick={() => setIssueOpen(true)} disabled={pending}>
          <AlertTriangle size={17} /> Report an issue
        </MobileButton>
      </div>

      <Sheet open={costOpen} onOpenChange={setCostOpen}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-2xl rounded-t-2xl border-x">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Sourcing cost</SheetTitle>
            <SheetDescription className="text-[13px] text-[#8F8F8F]">
              What did you actually pay at the market?
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <Label htmlFor="actual-cost" className="text-[13px] font-semibold">
              Amount paid (NGN)
            </Label>
            <Input
              id="actual-cost"
              inputMode="decimal"
              value={actualCost}
              onChange={(event) => setActualCost(event.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="h-12 rounded-[10px]"
            />
            <MobileButton
              disabled={pending || !actualCost.trim() || !Number.isFinite(Number(actualCost))}
              onClick={() => void runAction("secure")}
            >
              {pending ? <HookLoader size="button" /> : "Confirm secured"}
            </MobileButton>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={issueOpen} onOpenChange={setIssueOpen}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-2xl rounded-t-2xl border-x">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Report an issue</SheetTitle>
            <SheetDescription className="text-[13px] text-[#8F8F8F]">
              Tell operations what is blocking this task.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <Textarea
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="Describe an unavailable, damaged, or sourcing issue"
              className="min-h-24 rounded-[10px]"
            />
            <MobileButton variant="danger" onClick={() => void reportIssue()} disabled={pending || !issue.trim()}>
              {pending ? <HookLoader size="button" /> : "Submit issue"}
            </MobileButton>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
