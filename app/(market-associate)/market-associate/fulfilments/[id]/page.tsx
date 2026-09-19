"use client";

import { useId, useState } from "react";
import { ArrowLeft, AlertTriangle, Camera, Check, KeyRound, Package } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { apiPost, apiRequest } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { WorkflowThumbnail } from "@/components/market-associate/WorkflowThumbnail";

type ItemVerification = {
  orderItemId: string;
  photoUrl?: string;
  photos?: Array<{ view: "front" | "side" | "back"; url: string; assetId?: string }>;
  actualColor?: string;
  actualSize?: string;
  actualQuantity?: number;
  unitCostMinor?: number;
  supplierReference?: string;
  conditionNote?: string;
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
  selectedVariants?: { color?: string; size?: string };
  variantSnapshot?: { color?: string; size?: string; name?: string };
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
  package?: { scanCredential?: string; publicId?: string; labelReference?: string; status?: string };
  issues?: Array<{ orderItemId?: string; status?: string; type?: string }>;
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

function itemOptions(item: TaskItem) {
  const color = item.selectedVariants?.color || item.variantSnapshot?.color;
  const size = item.selectedVariants?.size || item.variantSnapshot?.size;
  const values = [color, size].filter(Boolean);
  return values.length ? values.join(" · ") : item.variantSnapshot?.name;
}

const emptyChecks = { productMatches: false, sizeMatches: false, colorMatches: false, quantityMatches: false };

export default function MarketAssociateFulfilmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<Task>(
    ["marketassociate", "fulfilment", params.id],
    `/market-associate/fulfilments/${params.id}`,
    Boolean(params.id),
  );
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [credential, setCredential] = useState<string>();
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [photos, setPhotos] = useState<Partial<Record<"front" | "side" | "back", string>>>({});
  const [photoView, setPhotoView] = useState<"front" | "side" | "back">("front");
  const [actualColor, setActualColor] = useState("");
  const [actualSize, setActualSize] = useState("");
  const [actualQuantity, setActualQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [conditionNote, setConditionNote] = useState("");
  const [issueType, setIssueType] = useState("PRODUCT_UNAVAILABLE");
  const [checks, setChecks] = useState(emptyChecks);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputId = useId();

  /**
   * Task changes also move the fulfilments list and the dashboard counters, so
   * refetching this detail alone would leave those showing the previous state.
   */
  function syncTask() {
    void queryClient.invalidateQueries({ queryKey: ["marketassociate", "fulfilment", params.id] });
    void queryClient.invalidateQueries({ queryKey: ["marketassociate", "fulfilments"] });
    void queryClient.invalidateQueries({ queryKey: ["marketassociate", "catalog-dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["marketassociate", "notifications"] });
  }

  async function runAction(action: string) {
    setPending(true);
    try {
      const result = await apiPost<Task>(`/market-associate/fulfilments/${params.id}/${action}`, {
        version: query.data?.version,
      });
      setCredential(result.package?.scanCredential);
      syncTask();
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
      await apiPost(selectedItemId
        ? `/market-associate/fulfilments/${params.id}/items/${selectedItemId}/issues`
        : `/market-associate/fulfilments/${params.id}/issues`, {
        summary: issue.trim(),
        type: selectedItemId ? issueType : "ITEM_UNAVAILABLE",
        orderItemId: selectedItemId,
        idempotencyKey: crypto.randomUUID(),
      });
      syncTask();
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

  async function uploadPhoto(files: FileList | null, view: "front" | "side" | "back") {
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
      setPhotos((current) => ({ ...current, [view]: uploaded.secureUrl || uploaded.url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Photo could not be uploaded");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function verifyItem() {
    if (!selectedItemId || !photos.front || !photos.side || !photos.back) return;
    setPending(true);
    try {
      await apiRequest(`/market-associate/fulfilments/${params.id}/items/${selectedItemId}`, { method: "PUT", body: JSON.stringify({
        photos: (["front", "side", "back"] as const).map((view) => ({ view, url: photos[view] })),
        actualColor,
        actualSize,
        actualQuantity: Number(actualQuantity),
        unitCostMinor: Math.round(Number(unitCost) * 100),
        supplierReference: supplierReference || undefined,
        conditionNote,
        checks,
      }) });
      syncTask();
      toast.success(Object.values(checks).every(Boolean) ? "Item verified" : "Verification saved");
      setSelectedItemId(undefined);
      setPhotos({});
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
    setPhotos(Object.fromEntries((existing?.photos || (existing?.photoUrl ? [{ view: "front", url: existing.photoUrl }] : [])).map((photo) => [photo.view, photo.url])));
    setActualColor(existing?.actualColor || item.selectedVariants?.color || item.variantSnapshot?.color || "");
    setActualSize(existing?.actualSize || item.selectedVariants?.size || item.variantSnapshot?.size || "");
    setActualQuantity(String(existing?.actualQuantity || item.quantity || 1));
    setUnitCost(existing?.unitCostMinor != null ? String(existing.unitCostMinor / 100) : "");
    setSupplierReference(existing?.supplierReference || "");
    setConditionNote(existing?.conditionNote || "");
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
  const canVerify = task.status === "SOURCING" || task.status === "PRODUCT_SECURED" || task.status === "PACKING";

  const selectedItem = items.find((item) => itemId(item) === selectedItemId);
  const selectedVerification = verifications.find((v) => v.orderItemId === selectedItemId);
  const allChecked = Object.values(checks).every(Boolean);
  const displayCredential = credential || task.package?.scanCredential;

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

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8F8F8F]">Ordered</p>
            <WorkflowThumbnail
              src={itemReferencePhoto(selectedItem)}
              alt={`${itemLabel(selectedItem)} ordered reference`}
              className="aspect-square size-auto w-full rounded-[10px]"
            />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8F8F8F]">Required evidence</p>
            <Input
              id={fileInputId}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                void uploadPhoto(event.target.files, photoView);
                event.currentTarget.value = "";
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {(["front", "side", "back"] as const).map((view) => (
                <button key={view} type="button" disabled={uploadingPhoto} onClick={() => { setPhotoView(view); document.getElementById(fileInputId)?.click(); }} className="overflow-hidden rounded-[10px] border bg-white text-[#8F8F8F]">
                  <span className="relative flex aspect-square items-center justify-center bg-[#EAEBE7]">
                    {photos[view] ? <Image src={photos[view]!} alt={`${view} view`} fill className="object-cover" unoptimized /> : <Camera size={22} />}
                  </span>
                  <span className="block py-2 text-[11px] font-semibold capitalize">{view} view</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#8F8F8F]">Capture the full product clearly from all three angles.</p>
          </div>
        </div>

        <MobileSection title="Actual product details">
          <div className="grid gap-3 p-2.5 sm:grid-cols-2">
            <div><Label>Colour</Label><Input value={actualColor} onChange={(event) => setActualColor(event.target.value)} placeholder="Actual colour" /></div>
            <div><Label>Size</Label><Input value={actualSize} onChange={(event) => setActualSize(event.target.value)} placeholder="Actual size" /></div>
            <div><Label>Quantity</Label><Input inputMode="numeric" value={actualQuantity} onChange={(event) => setActualQuantity(event.target.value.replace(/\D/g, ""))} /></div>
            <div><Label>Unit cost (NGN)</Label><Input inputMode="decimal" value={unitCost} onChange={(event) => setUnitCost(event.target.value.replace(/[^0-9.]/g, ""))} /></div>
            <div className="sm:col-span-2"><Label>Supplier reference (optional)</Label><Input value={supplierReference} onChange={(event) => setSupplierReference(event.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Condition note</Label><Textarea value={conditionNote} onChange={(event) => setConditionNote(event.target.value)} placeholder="Describe the product condition" /></div>
          </div>
        </MobileSection>

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
            disabled={pending || !photos.front || !photos.side || !photos.back || !actualColor || !actualSize || !actualQuantity || !unitCost || conditionNote.trim().length < 3 || !allChecked}
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
              <select value={issueType} onChange={(event) => setIssueType(event.target.value)} className="h-12 w-full rounded-[10px] border bg-white px-3 text-sm">
                <option value="PRODUCT_UNAVAILABLE">Product unavailable</option><option value="COLOR_UNAVAILABLE">Colour unavailable</option><option value="SIZE_UNAVAILABLE">Size unavailable</option><option value="INSUFFICIENT_QUANTITY">Insufficient quantity</option><option value="DAMAGED_PRODUCT">Product damaged</option><option value="PRICE_CHANGED">Price changed</option><option value="WRONG_CATALOG_DETAILS">Wrong catalog details</option><option value="OTHER">Other</option>
              </select>
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

      {displayCredential && (
        <div className="mb-7 rounded-[10px] bg-[#FFF3C4] p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#9a7400]">
            <KeyRound size={14} /> Write this handover code on the package
          </p>
          <p className="mt-2 font-mono text-[30px] font-bold tracking-[0.3em] text-black">{displayCredential}</p>
          <p className="mt-1 text-[12px] font-semibold text-black">{task.package?.labelReference || task.package?.publicId}</p>
          <p className="mt-1.5 text-[12px] text-[#9a7400]">
            This remains available until the Hub verifies receipt.
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
            const unresolvedIssue = task.issues?.find((issue) => issue.orderItemId === id);
            return (
              <MobileRow
                key={id || index}
                leading={
                  <WorkflowThumbnail
                    src={itemReferencePhoto(item)}
                    alt={`${itemLabel(item)} product`}
                    className="size-14"
                  />
                }
                tone={unresolvedIssue ? "danger" : verification?.matched ? "brand" : "neutral"}
                label={itemLabel(item)}
                description={[
                  itemOptions(item),
                  unresolvedIssue ? "Needs resolution" : canVerify ? (verification?.matched ? "Verified" : "Not started") : undefined,
                ].filter(Boolean).join(" · ") || undefined}
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
              disabled={pending || (["secure", "pack"].includes(next.action) && !allVerified)}
              onClick={() => {
                void runAction(next.action);
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
      </div>
    </div>
  );
}
