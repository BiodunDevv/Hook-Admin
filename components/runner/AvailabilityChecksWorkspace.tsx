"use client";

import { useState } from "react";
import { AlertTriangle, Check, Clock3, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { MobileButton, MobileHeader } from "@/components/mobile/MobileUI";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Check = {
  publicId: string;
  title: string;
  marketId: string;
  availabilityCheckDueAt?: string;
  availabilityCheckNote?: string;
  catalogVersion: number;
  status: string;
};

function isOverdue(value?: string) {
  return Boolean(value && new Date(value) < new Date());
}

function dueLabel(value?: string) {
  if (!value) return "Due date pending";
  return isOverdue(value) ? "Overdue" : `Due ${new Date(value).toLocaleDateString("en-NG")}`;
}

export function AvailabilityChecksWorkspace() {
  const query = useApiQuery<Check[]>(["runner", "availability-checks"], "/runner/availability-checks");
  const [acting, setActing] = useState<string | null>(null);
  const [reporting, setReporting] = useState<Check | null>(null);
  const [note, setNote] = useState("");

  async function confirm(item: Check, status: "available" | "limited") {
    setActing(item.publicId);
    try {
      await apiPost(`/runner/products/${item.publicId}/availability/confirm`, {
        status,
        version: item.catalogVersion,
        note:
          status === "limited"
            ? "Runner confirmed limited availability."
            : "Runner confirmed availability.",
      });
      toast.success(`Product marked ${status}`);
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Availability could not be updated",
      );
    } finally {
      setActing(null);
    }
  }

  async function submitReport() {
    if (!reporting || note.trim().length < 3) return;
    setActing(reporting.publicId);
    try {
      await apiPost(`/runner/products/${reporting.publicId}/availability/report`, {
        note: note.trim(),
        version: reporting.catalogVersion,
      });
      toast.success("Product paused and Admin notified");
      setReporting(null);
      setNote("");
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Availability could not be updated",
      );
    } finally {
      setActing(null);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Loading availability checks" />
      </div>
    );

  const checks = query.data || [];

  return (
    <div>
      <MobileHeader
        title="Availability checks"
        subtitle="Confirm with the supplier before products return to the catalog."
        action={
          checks.length ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#8F8F8F]">
              {checks.length}
            </span>
          ) : undefined
        }
      />

      <QueryState
        error={query.error}
        errorTitle="Availability checks could not load"
        empty={!checks.length}
        emptyIcon={Check}
        emptyTitle="You are up to date"
        emptyDescription="There are no products waiting for your confirmation."
        onRetry={() => void query.refetch()}
      >
        <div className="space-y-3">
          {checks.map((item) => {
            const overdue = isOverdue(item.availabilityCheckDueAt);
            const busy = acting === item.publicId;
            return (
              <div key={item.publicId} className="rounded-[10px] bg-white p-4">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 grid size-7.5 shrink-0 place-items-center rounded-[5px] ${overdue ? "bg-red-50 text-red-600" : "bg-[#EAEBE7] text-black"}`}
                  >
                    {overdue ? <AlertTriangle size={17} /> : <Clock3 size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight text-black">{item.title}</p>
                    <p className={`mt-1 text-[12px] font-semibold ${overdue ? "text-red-600" : "text-[#8F8F8F]"}`}>
                      {dueLabel(item.availabilityCheckDueAt)}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-5 text-[#8F8F8F]">
                      {item.availabilityCheckNote || "Confirm with the source supplier before choosing an outcome."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ActionChip
                    icon={Check}
                    label="Available"
                    tone="brand"
                    disabled={busy}
                    onClick={() => void confirm(item, "available")}
                  />
                  <ActionChip
                    icon={Clock3}
                    label="Limited"
                    tone="neutral"
                    disabled={busy}
                    onClick={() => void confirm(item, "limited")}
                  />
                  <ActionChip
                    icon={XCircle}
                    label="Unavailable"
                    tone="danger"
                    disabled={busy}
                    onClick={() => {
                      setReporting(item);
                      setNote("");
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>

      <Sheet
        open={Boolean(reporting)}
        onOpenChange={(next) => {
          if (!next) {
            setReporting(null);
            setNote("");
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-2xl rounded-t-2xl border-x"
        >
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Report unavailable</SheetTitle>
            <SheetDescription className="text-[13px] text-[#8F8F8F]">
              {reporting?.title} will be paused and Admin notified.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <Label htmlFor="unavailable-note" className="text-[13px] font-semibold">
              Why is this unavailable?
            </Label>
            <Textarea
              id="unavailable-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Supplier no longer stocks this item"
              className="min-h-24 rounded-[10px]"
            />
            <MobileButton
              variant="danger"
              disabled={note.trim().length < 3 || Boolean(acting)}
              onClick={() => void submitReport()}
            >
              {acting ? <HookLoader size="button" /> : "Report unavailable"}
            </MobileButton>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ActionChip({
  icon: Icon,
  label,
  tone,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  tone: "brand" | "neutral" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  const tones = {
    brand: "bg-[#FFC809] text-black",
    neutral: "bg-[#EAEBE7] text-black",
    danger: "bg-red-50 text-red-600",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-[10px] text-[12px] font-semibold transition active:opacity-80 disabled:opacity-40 ${tones[tone]}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
