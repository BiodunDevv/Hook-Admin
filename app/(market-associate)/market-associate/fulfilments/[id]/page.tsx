"use client";

import { useId, useState } from "react";
import { ArrowLeft, AlertTriangle, Camera, Check, KeyRound, Package, ShoppingBag } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton, MobileRow, MobileSection } from "@/components/mobile/MobileUI";
import { apiPost, apiRequest } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type ItemVerification = {
  orderItemId: string;
  photoUrl: string;
  matched: boolean;
  checks?: { productMatches: boolean; sizeMatches: boolean; colorMatches: boolean; quantityMatches: boolean };
};

type TaskItem = {
  id?: string;
  _id?: string;
  productSnapshot?: { title?: string; images?: string[] };
  productTitle?: string;
  productImage?: string;
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
  itemVerifications?: ItemVerification[];
  package?: { scanCredential?: string };
};

const actions: Record<string, { label: string; action: string }> = {
  ALERTED: { label: "Accept task", action: "accept" },
  ACCEPTED: { label: "Start sourcing", action: "start_sourcing" },
  SOURCING: { label: "Mark product secured", action: "secure" },
  PRODUCT_SECURED: { label: "Begin packing", action: "begin_packing" },
  PACKING: { label: "Pack and create Hub label", action: "pack" },
};

function itemId(item: TaskItem) {
  return item.id || item._id || "";
}

function itemLabel(item: TaskItem) {
  return item.productSnapshot?.title || item.productTitle || "Product item";
}

function itemReferencePhoto(item: TaskItem) {
  return item.productImage || item.productSnapshot?.images?.[0];
}

const emptyChecks = { productMatches: false, sizeMatches: false, colorMatches: false, quantityMatches: false };

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
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string>();
  const [checks, setChecks] = useState(emptyChecks);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputId = useId();

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
        orderItemId: selectedItemId,
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

  async function uploadPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploaded = await apiRequest<{ url: string; secureUrl?: string }>("/upload/image", {
        method: "POST",
        body: formData,
      });
      setPendingPhotoUrl(uploaded.secureUrl || uploaded.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Photo could not be uploaded");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function verifyItem() {
    if (!selectedItemId || !pendingPhotoUrl) return;
    setPending(true);
    try {
      await apiPost(`/runner/fulfilments/${params.id}/items/${selectedItemId}/verify`, {
        photoUrl: pendingPhotoUrl,
        checks,
      });
      await query.refetch();
      toast.success(Object.values(checks).every(Boolean) ? "Item verified" : "Verification saved");
      setSelectedItemId(undefined);
      setPendingPhotoUrl(undefined);
      setChecks(emptyChecks);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Item could not be verified",
      );
    } finally {
      setPending(false);
    }
  }

  function openItem(item: TaskItem) {
    const id = itemId(item);
    const existing = task?.itemVerifications?.find((v) => v.orderItemId === id);
    setPendingPhotoUrl(existing?.photoUrl);
    setChecks(existing?.checks || emptyChecks);
    setSelectedItemId(id);
  }

  function openIssueForItem(id?: string) {
    setSelectedItemId(id);
    setIssueOpen(true);
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
  const items = task.items || [];
  const verifications = task.itemVerifications || [];
  const verifiedCount = items.filter((item) => verifications.some((v) => v.orderItemId === itemId(item) && v.matched)).length;
  const allVerified = items.length > 0 && verifiedCount === items.length;
  const canVerify = task.status === "PRODUCT_SECURED" || task.status === "PACKING";

  const selectedItem = items.find((item) => itemId(item) === selectedItemId);
  const selectedVerification = verifications.find((v) => v.orderItemId === selectedItemId);
  const allChecked = Object.values(checks).every(Boolean);

  if (selectedItem) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedItemId(undefined)}
          className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="mb-6 px-1">
          <h1 className="text-[20px] font-bold leading-tight text-black">
            Verify Item — {verifiedCount}/{items.length} verified
          </h1>
          <p className="mt-1 text-[13px] text-[#8F8F8F]">{itemLabel(selectedItem)}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8F8F8F]">Ordered</p>
            <div className="relative aspect-square overflow-hidden rounded-[10px] bg-[#EAEBE7]">
              {itemReferencePhoto(selectedItem) ? (
                <Image src={itemReferencePhoto(selectedItem)!} alt="Ordered reference" fill className="object-cover" unoptimized />
              ) : (
                <div className="grid h-full place-items-center text-[#8F8F8F]">
                  <Package size={28} />
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8F8F8F]">Picked up</p>
            <Input
              id={fileInputId}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                void uploadPhoto(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            {pendingPhotoUrl ? (
              <button
                type="button"
                onClick={() => document.getElementById(fileInputId)?.click()}
                className="relative block aspect-square w-full overflow-hidden rounded-[10px] bg-[#EAEBE7]"
              >
                <Image src={pendingPhotoUrl} alt="Picked up" fill className="object-cover" unoptimized />
              </button>
            ) : (
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => document.getElementById(fileInputId)?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#D9D9D9] bg-white text-[#8F8F8F]"
              >
                {uploadingPhoto ? (
                  <HookLoader label="Uploading" />
                ) : (
                  <>
                    <Camera size={26} />
                    <span className="text-[12px] font-medium">Add Photo</span>
                  </>
                )}
              </button>
            )}
            {pendingPhotoUrl && (
              <MobileButton
                variant="outline"
                className="mt-2 min-h-9 text-[12px]"
                onClick={() => document.getElementById(fileInputId)?.click()}
              >
                {uploadingPhoto ? <HookLoader size="button" /> : "Take Photo"}
              </MobileButton>
            )}
          </div>
        </div>

        <MobileSection title="Checklist">
          {(
            [
              ["productMatches", "Product matches"],
              ["sizeMatches", "Size matches"],
              ["colorMatches", "Color matches"],
              ["quantityMatches", "Quantity matches"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex min-h-14 items-center justify-between border-b border-[#D9D9D9] px-2.5 last:border-b-0">
              <span className="text-[15px] font-medium text-black">{label}</span>
              <Switch
                checked={checks[key]}
                onCheckedChange={(value) => setChecks((current) => ({ ...current, [key]: value }))}
              />
            </div>
          ))}
        </MobileSection>

        {selectedVerification && !selectedVerification.matched && (
          <p className="mb-4 rounded-[10px] bg-[#FFF0ED] p-3 text-center text-[13px] text-[#A52E28]">
            This item was previously saved with an unmatched check. Update it or report an issue.
          </p>
        )}

        <div className="flex items-center gap-3">
          <MobileButton
            variant="danger"
            className="flex-1"
            onClick={() => openIssueForItem(selectedItemId)}
            disabled={pending}
          >
            <AlertTriangle size={17} /> Report Issue
          </MobileButton>
          <MobileButton
            className="flex-1"
            disabled={pending || !pendingPhotoUrl || !allChecked}
            onClick={() => void verifyItem()}
          >
            {pending ? <HookLoader size="button" /> : <><Check size={18} /> Item Matches</>}
          </MobileButton>
        </div>

        <Sheet open={issueOpen} onOpenChange={setIssueOpen}>
          <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x">
            <SheetHeader>
              <SheetTitle className="text-[17px] font-bold">Report an issue</SheetTitle>
              <SheetDescription className="text-[13px] text-[#8F8F8F]">
                Tell operations what is blocking this item.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 overflow-y-auto px-4 pb-6">
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

      <MobileSection
        title={canVerify ? `Verify Item — ${verifiedCount}/${items.length} verified` : `Items to collect (${items.length})`}
      >
        {items.length ? (
          items.map((item, index) => {
            const id = itemId(item);
            const verification = verifications.find((v) => v.orderItemId === id);
            return (
              <MobileRow
                key={id || index}
                icon={verification?.matched ? Check : ShoppingBag}
                tone={verification?.matched ? "brand" : "neutral"}
                label={itemLabel(item)}
                description={canVerify ? (verification?.matched ? "Verified" : "Needs photo verification") : undefined}
                value={`Qty ${item.quantity ?? 1}`}
                onClick={canVerify ? () => openItem(item) : undefined}
              />
            );
          })
        ) : (
          <MobileRow icon={Package} tone="neutral" label="Item details unavailable" />
        )}
      </MobileSection>

      <div className="space-y-3">
        {next ? (
          <>
            {next.action === "pack" && !allVerified && (
              <p className="text-center text-[13px] text-[#8F8F8F]">Verify all items before packing.</p>
            )}
            <MobileButton
              disabled={pending || (next.action === "pack" && !allVerified)}
              onClick={() => {
                if (next.action === "secure") setCostOpen(true);
                else void runAction(next.action);
              }}
            >
              {pending ? <HookLoader size="button" /> : <><Check size={18} /> {next.label}</>}
            </MobileButton>
          </>
        ) : (
          <p className="rounded-[10px] bg-white p-4 text-center text-[13px] text-[#8F8F8F]">
            No action is available in this state.
          </p>
        )}
        <MobileButton variant="outline" onClick={() => openIssueForItem(undefined)} disabled={pending}>
          <AlertTriangle size={17} /> Report an issue
        </MobileButton>
      </div>

      <Sheet open={costOpen} onOpenChange={setCostOpen}>
        <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Sourcing cost</SheetTitle>
            <SheetDescription className="text-[13px] text-[#8F8F8F]">
              What did you actually pay at the market?
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
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
        <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border-x">
          <SheetHeader>
            <SheetTitle className="text-[17px] font-bold">Report an issue</SheetTitle>
            <SheetDescription className="text-[13px] text-[#8F8F8F]">
              Tell operations what is blocking this task.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
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
