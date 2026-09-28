"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton } from "@/components/mobile/MobileUI";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiRequest } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { cn } from "@/lib/utils";
import { PhotoSlot } from "./PhotoSlot";
import { EXTRA_VIEWS, ISSUE_TYPES, cleanError, type ViewKey } from "./types";

const MIN_LENGTH = 5;

/** Report a blocker for one product or the task; the idempotency key is reused on retry to avoid duplicate issues. */
export function IssueSheet({
  open,
  onOpenChange,
  taskRouteId,
  itemId,
  itemName,
  onReported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskRouteId: string;
  itemId?: string;
  itemName?: string;
  onReported: () => void;
}) {
  const [type, setType] = useState<string>("PRODUCT_UNAVAILABLE");
  const [summary, setSummary] = useState("");
  const [photos, setPhotos] = useState<Partial<Record<ViewKey, string>>>({});
  const [photosOpen, setPhotosOpen] = useState(false);
  const [uploading, setUploading] = useState<ViewKey | null>(null);
  const [pending, setPending] = useState(false);
  const key = useRef<string>(crypto.randomUUID());
  const ready = summary.trim().length >= MIN_LENGTH;
  const photoCount = EXTRA_VIEWS.filter((view) => photos[view]).length;

  async function upload(file: File, view: ViewKey) {
    setUploading(view);
    try {
      const formData = new FormData();
      formData.append("image", await compressImage(file));
      const uploaded = await apiRequest<{ url: string; secureUrl?: string }>("/upload/image", { method: "POST", body: formData });
      setPhotos((current) => ({ ...current, [view]: uploaded.secureUrl || uploaded.url }));
    } catch (error) {
      toast.error(cleanError(error, "Photo could not be uploaded. Check your connection and try again."));
    } finally {
      setUploading(null);
    }
  }

  function reset() {
    key.current = crypto.randomUUID();
    setSummary("");
    setPhotos({});
    setPhotosOpen(false);
  }

  async function submit() {
    if (!ready || pending || uploading) return;
    setPending(true);
    try {
      const evidence = EXTRA_VIEWS.filter((view) => photos[view]).map((view) => ({ type: "photo", url: photos[view]! }));
      // The per-item route already carries the item id in its path; the body schema there is strict and rejects it as a duplicate field.
      await apiPost(
        itemId ? `/market-associate/fulfilments/${taskRouteId}/items/${itemId}/issues` : `/market-associate/fulfilments/${taskRouteId}/issues`,
        itemId
          ? { summary: summary.trim(), type, evidence, idempotencyKey: key.current }
          : { summary: summary.trim(), type: "ITEM_UNAVAILABLE", orderItemId: itemId, evidence, idempotencyKey: key.current },
      );
      reset();
      onOpenChange(false);
      onReported();
      toast.success("Issue reported. Operations has been told.");
    } catch (error) {
      toast.error(cleanError(error, "Issue could not be reported"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-3xl border-x">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[17px] font-bold"><AlertTriangle className="size-5 text-red-600" />Report an issue</SheetTitle>
          <SheetDescription className="text-[13px] text-[#8F8F8F]">
            {itemName ? <>What is blocking <span className="font-semibold text-black">{itemName}</span>?</> : "Tell operations what is blocking this task."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {itemId && (
            <div role="radiogroup" aria-label="Issue type" className="grid grid-cols-2 gap-2">
              {ISSUE_TYPES.map((option) => {
                const selected = option.value === type;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setType(option.value)}
                    className={cn(
                      "flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition",
                      selected ? "border-black bg-black text-white" : "border-zinc-200 bg-white text-black hover:bg-zinc-50",
                    )}
                  >
                    {option.label}
                    {selected && <Check className="size-4 shrink-0 text-[#FFC809]" />}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={500}
              placeholder="Describe what you found, e.g. the vendor has no black in size 42"
              className="min-h-28 rounded-xl"
            />
            <p className="mt-1.5 flex justify-between text-[11px] text-[#8F8F8F]">
              <span>{ready ? "" : `At least ${MIN_LENGTH} characters`}</span>
              <span className="tabular-nums">{summary.length}/500</span>
            </p>
          </div>

          {!photosOpen && photoCount === 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-dashed border-[#E2E2E2] p-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-black">Do you want to add more images?</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#8F8F8F]">A photo of the problem helps Operations decide faster. Up to 4.</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotosOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-[12px] font-bold text-white transition active:scale-95"
              >
                <Plus className="size-3.5" /> Add images
              </button>
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#E2E2E2] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-black">Photos <span className="font-normal text-[#8F8F8F]">(optional)</span></p>
                <span className="text-[11px] font-semibold tabular-nums text-[#8F8F8F]">{photoCount}/{EXTRA_VIEWS.length}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-4 text-[#8F8F8F]">Show the damage, wrong item, or whatever is blocking this.</p>
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {EXTRA_VIEWS.map((view) => (
                  <PhotoSlot
                    key={view}
                    view={view}
                    optional
                    url={photos[view]}
                    uploading={uploading === view}
                    disabled={pending || (uploading !== null && uploading !== view)}
                    onPick={(file) => void upload(file, view)}
                    onRemove={() => setPhotos((current) => ({ ...current, [view]: undefined }))}
                  />
                ))}
              </div>
            </div>
          )}

          <MobileButton variant="danger" onClick={() => void submit()} disabled={pending || !ready || uploading !== null}>
            {pending ? <HookLoader size="button" /> : "Submit issue"}
          </MobileButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
