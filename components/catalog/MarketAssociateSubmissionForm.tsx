"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronUp, ImagePlus, Plus, Ruler, Save, Send, Star, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { money, type ProductSubmission } from "@/lib/catalog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileButton } from "@/components/mobile/MobileUI";
import { ColorPicker } from "@/components/mobile/ColorPicker";
import { SizePicker } from "@/components/mobile/SizePicker";
import type { SizingGuide } from "@/lib/sizing-guide";

interface MarketOption { publicId: string; name: string }
interface MarketVendorOption { publicId: string; businessName: string; contactName: string; status: string }
interface CategoryOption { publicId: string; name: string; sizingGuide?: SizingGuide | null }
interface UploadIntent {
  uploadIntentId: string;
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  type: string;
  signature: string;
}

interface MediaReadiness {
  provider: "cloudinary";
  mode: "signed";
  enabled: boolean;
  configured: boolean;
  available: boolean;
  maxBytes: number;
  supportedFormats: string[];
}

interface FormState {
  marketId: string;
  marketVendorId: string;
  categorySuggestionId: string;
  basicTitle: string;
  notes: string;
  basePrice: string;
  mediaIds: string[];
  availabilityStatus: string;
  availabilityNote: string;
  internalSellerReference: string;
  variants: Array<{ size: string; colour: string; attributes: Record<string, string>; active: boolean }>;
}

function initialValue(submission?: ProductSubmission): FormState {
  return {
    marketId: submission?.marketId || "",
    marketVendorId: submission?.marketVendorId || "",
    categorySuggestionId: submission?.categorySuggestionId || "",
    basicTitle: submission?.basicTitle || "",
    notes: submission?.notes || "",
    basePrice: submission ? String(submission.basePriceMinor / 100) : "",
    mediaIds: submission?.mediaIds || [],
    availabilityStatus: submission?.availabilityStatus || "available",
    availabilityNote: submission?.availabilityNote || "",
    internalSellerReference: submission?.internalSellerReference || "",
    variants: submission?.variants?.map((item) => ({
      size: item.size || "",
      colour: item.colour || "",
      attributes: item.attributes || {},
      active: item.active,
    })) || [{ size: "", colour: "", attributes: {}, active: true }],
  };
}

export function RunnerSubmissionForm({
  submission,
  markets,
  categories,
}: {
  submission?: ProductSubmission;
  markets: MarketOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => initialValue(submission));
  const [mediaById, setMediaById] = useState<Record<string, { deliveryUrl?: string; width?: number; height?: number }>>(
    () => Object.fromEntries((submission?.media || []).map((item) => [item.publicId, item])),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sizingGuideExpanded, setSizingGuideExpanded] = useState(false);
  const editable = !submission || ["draft", "changes_requested"].includes(submission.status);
  const selectedCategory = categories.find((category) => category.publicId === form.categorySuggestionId);
  const sizingGuide = selectedCategory?.sizingGuide;
  const mediaReadiness = useQuery({
    queryKey: ["catalog-media-readiness"],
    queryFn: () => apiGet<MediaReadiness>("/catalog/media/readiness"),
    staleTime: 60_000,
    retry: 1,
  });
  const vendors = useQuery({
    queryKey: ["runner", "market-vendors", form.marketId],
    queryFn: () => apiGet<MarketVendorOption[]>(`/runner/markets/${encodeURIComponent(form.marketId)}/vendors`),
    enabled: editable && Boolean(form.marketId),
    staleTime: 30_000,
  });
  const mediaAvailable = mediaReadiness.data?.available === true;

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const payload = useMemo(() => ({
    marketId: form.marketId,
    marketVendorId: form.marketVendorId,
    categorySuggestionId: form.categorySuggestionId,
    basicTitle: form.basicTitle.trim(),
    notes: form.notes.trim() || undefined,
    mediaIds: form.mediaIds,
    basePriceMinor: Math.round(Number(form.basePrice) * 100),
    currency: "NGN",
    variants: form.variants.filter((variant) => variant.size || variant.colour),
    availabilityStatus: form.availabilityStatus,
    availabilityNote: form.availabilityNote.trim() || undefined,
    internalSellerReference: form.internalSellerReference.trim() || undefined,
    ...(submission ? { version: submission.version } : {}),
  }), [form, submission]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  async function save(submitAfter = false) {
    if (submitAfter) {
      // A variant needs size, colour, or an attribute — mirrors the backend's
      // own submit-time check, so the runner sees this before the round trip,
      // not as a generic "could not be saved" toast after the fact.
      const hasCompleteVariant = form.variants.some(
        (variant) => variant.size.trim() || variant.colour.trim() || Object.keys(variant.attributes).length,
      );
      if (!hasCompleteVariant) {
        toast.error("Add at least one size or colour before submitting for review");
        return;
      }
    }
    setSaving(true);
    try {
      const saved = submission
        ? await apiPatch<ProductSubmission>(`/runner/product-submissions/${submission.publicId}`, payload)
        : await apiPost<ProductSubmission>("/runner/product-submissions", payload);
      if (submitAfter) {
        await apiPost(`/runner/product-submissions/${saved.publicId}/submit`, { version: saved.version });
        toast.success("Submission sent to Catalog Review");
      } else {
        toast.success("Draft saved");
      }
      setDirty(false);
      router.replace(`/runner/submissions/${saved.publicId}`);
      router.refresh();
    } catch (error) {
      const details = (error as { details?: { fields?: string[] } })?.details;
      if (details?.fields?.length) {
        toast.error(`Missing before submitting: ${details.fields.join(", ")}`);
      } else {
        toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Submission could not be saved");
      }
    } finally {
      setSaving(false);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!mediaAvailable) {
      toast.error("Secure image uploads are temporarily unavailable");
      return;
    }
    setUploading(true);
    try {
      const intent = await apiPost<UploadIntent>("/catalog/media/upload-intents", {
        ownerType: "submission",
        originalName: file.name,
        mimeType: file.type,
        bytes: file.size,
      });
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", intent.apiKey);
      body.append("timestamp", String(intent.timestamp));
      body.append("folder", intent.folder);
      body.append("public_id", intent.publicId);
      body.append("type", intent.type);
      body.append("signature", intent.signature);
      const providerResponse = await fetch(intent.uploadUrl, { method: "POST", body });
      const provider = await providerResponse.json();
      if (!providerResponse.ok) throw new Error(provider?.error?.message || "Image upload failed");
      const asset = await apiPost<{ publicId: string; deliveryUrl?: string; width?: number; height?: number }>("/catalog/media/finalize", {
        uploadIntentId: intent.uploadIntentId,
        providerPublicId: provider.public_id,
        version: String(provider.version),
        ownerType: "submission",
      });
      setMediaById((current) => ({ ...current, [asset.publicId]: asset }));
      update("mediaIds", [...form.mediaIds, asset.publicId]);
      toast.success("Image uploaded securely");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  const noVendors = Boolean(form.marketId && !vendors.isLoading && !vendors.data?.length);

  return (
    <div className="pb-4">
      {submission?.reviewNotes?.length ? (
        <div className="mb-6 rounded-[10px] bg-[#FFF3C4] p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#9a7400]">
            <AlertCircle className="size-4" /> Catalog Review feedback
          </p>
          <div className="mt-2 space-y-1.5">
            {submission.reviewNotes.slice().reverse().map((note, index) => (
              <p key={`${note.createdAt}-${index}`} className="text-[13px] leading-5 text-black">
                <span className="font-semibold capitalize">{note.action.replaceAll("_", " ")}</span>
                {note.message ? `: ${note.message}` : ""}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {submission?.approvedProduct ? (
        <div className="mb-6 grid gap-3 rounded-[10px] border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-700">Runner observed</p>
            <p className="mt-1 text-[16px] font-bold text-black">{money(submission.basePriceMinor, submission.currency)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-700">Approved Hook price</p>
            <p className="mt-1 text-[16px] font-bold text-black">{money(submission.approvedProduct.sellingPriceMinor, submission.approvedProduct.currency)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-700">Catalog status</p>
            <p className="mt-1 text-[16px] font-bold capitalize text-black">{submission.approvedProduct.status.replaceAll("_", " ")}</p>
          </div>
        </div>
      ) : null}

      {/* Photos first — this is a capture flow, not a data-entry form. */}
      <FormBlock title="Photos" hint="The first photo is the primary image shown to Catalog Review.">
        {mediaReadiness.isError || (mediaReadiness.isSuccess && !mediaAvailable) ? (
          <Alert className="mb-3">
            <AlertCircle />
            <AlertTitle>Secure uploads unavailable</AlertTitle>
            <AlertDescription>
              Draft media is safe. Save the draft and upload once the media service is restored.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="grid grid-cols-3 gap-2">
          {form.mediaIds.map((id, index) => {
            const asset = mediaById[id];
            return (
              <div key={id} className="group relative aspect-square overflow-hidden rounded-[10px] bg-muted">
                {asset?.deliveryUrl ? (
                  <Image src={asset.deliveryUrl} alt="Submission media" fill sizes="120px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex size-full items-center justify-center"><HookLoader size="inline" /></div>
                )}
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <Star className="size-2.5 fill-current" /> Primary
                  </span>
                )}
                {editable && (
                  <button
                    type="button"
                    onClick={() => update("mediaIds", form.mediaIds.filter((value) => value !== id))}
                    className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white transition sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <label
            className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-[#D9D9D9] text-[12px] font-semibold text-[#8F8F8F] ${editable && mediaAvailable && !uploading ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
          >
            {mediaReadiness.isLoading || uploading ? (
              <HookLoader size="inline" />
            ) : (
              <>
                <ImagePlus className="size-6" />
                {mediaAvailable ? "Add photo" : "Unavailable"}
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              capture="environment"
              className="sr-only"
              disabled={!editable || uploading || !mediaAvailable}
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
        </div>
      </FormBlock>

      <FormBlock title="Product">
        <MobileField label="Product title">
          <Input
            disabled={!editable}
            value={form.basicTitle}
            onChange={(event) => update("basicTitle", event.target.value)}
            placeholder="Clear product name"
            className="h-12 rounded-[10px]"
          />
        </MobileField>
        <MobileField label="Observed market price (NGN)">
          <Input
            disabled={!editable}
            inputMode="decimal"
            value={form.basePrice}
            onChange={(event) => update("basePrice", event.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="h-12 rounded-[10px]"
          />
        </MobileField>
        <MobileField label="Suggested category">
          <Select
            disabled={!editable}
            value={form.categorySuggestionId}
            onValueChange={(value) => {
              update("categorySuggestionId", value);
              setSizingGuideExpanded(false);
            }}
          >
            <SelectTrigger className="h-12 rounded-[10px]"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.publicId} value={category.publicId}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MobileField>
        {sizingGuide?.summary ? (
          <div className="rounded-[10px] bg-[#FFF9E6] p-3">
            <div className="flex items-start gap-2">
              <Ruler className="mt-0.5 size-4 shrink-0 text-[#9a7400]" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#5a4300]">{sizingGuide.summary}</p>
                {sizingGuide.howToMeasure ? (
                  <button
                    type="button"
                    onClick={() => setSizingGuideExpanded((current) => !current)}
                    className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#9a7400]"
                  >
                    How to measure
                    {sizingGuideExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                ) : null}
                {sizingGuideExpanded && sizingGuide.howToMeasure ? (
                  <p className="mt-1.5 whitespace-pre-line text-[12px] leading-5 text-[#5a4300]">
                    {sizingGuide.howToMeasure}
                  </p>
                ) : null}
                {sizingGuideExpanded && sizingGuide.chart?.length ? (
                  <div className="mt-2 space-y-1 overflow-hidden rounded-[8px] bg-white/70">
                    {sizingGuide.chart.map((row) => (
                      <div key={row.size} className="flex flex-wrap gap-x-3 gap-y-0.5 px-2.5 py-1.5 text-[12px] text-[#5a4300]">
                        <span className="font-semibold">{row.size}</span>
                        {Object.entries(row.measurements).map(([label, value]) => (
                          <span key={label} className="text-[#7a6000]">
                            {label}: {value}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        <MobileField label="Capture notes">
          <Textarea
            disabled={!editable}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Materials, condition, distinguishing details, and seller context."
            className="min-h-28 rounded-[10px]"
          />
        </MobileField>
      </FormBlock>

      <FormBlock title="Source" hint="Where you collected this product from.">
        <MobileField label="Assigned Market">
          <Select
            disabled={!editable}
            value={form.marketId}
            onValueChange={(value) => {
              setForm((current) => ({ ...current, marketId: value, marketVendorId: "" }));
              setDirty(true);
            }}
          >
            <SelectTrigger className="h-12 rounded-[10px]"><SelectValue placeholder="Select Market" /></SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.publicId} value={market.publicId}>{market.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MobileField>
        <MobileField
          label="Source supplier"
          error={noVendors ? "No suppliers yet in this Market." : undefined}
        >
          <Select
            disabled={!editable || !form.marketId || vendors.isLoading}
            value={form.marketVendorId}
            onValueChange={(value) => update("marketVendorId", value)}
          >
            <SelectTrigger className="h-12 rounded-[10px]">
              <SelectValue placeholder={vendors.isLoading ? "Loading suppliers" : "Select supplier"} />
            </SelectTrigger>
            <SelectContent>
              {(vendors.data || []).map((vendor) => (
                <SelectItem key={vendor.publicId} value={vendor.publicId}>
                  {vendor.businessName} · {vendor.contactName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {noVendors && (
            <Link
              href={`/runner/markets/${form.marketId}`}
              className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#9a7400]"
            >
              <UserPlus className="size-3.5" /> Onboard a supplier for this Market
            </Link>
          )}
        </MobileField>
        <MobileField label="Seller reference (internal)">
          <Input
            disabled={!editable}
            value={form.internalSellerReference}
            onChange={(event) => update("internalSellerReference", event.target.value)}
            placeholder="Stall or contact reference"
            className="h-12 rounded-[10px]"
          />
        </MobileField>
        <MobileField label="Availability">
          <Select disabled={!editable} value={form.availabilityStatus} onValueChange={(value) => update("availabilityStatus", value)}>
            <SelectTrigger className="h-12 rounded-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="limited">Limited</SelectItem>
              <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
            </SelectContent>
          </Select>
        </MobileField>
      </FormBlock>

      <FormBlock
        title="Variants"
        hint="Required — add at least one size, colour, or both."
        action={
          editable ? (
            <button
              type="button"
              onClick={() => update("variants", [...form.variants, { size: "", colour: "", attributes: {}, active: true }])}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#9a7400]"
            >
              <Plus className="size-3.5" /> Add
            </button>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {form.variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <SizePicker
                disabled={!editable}
                value={variant.size}
                groups={sizingGuide?.presetGroups}
                onChange={(next) =>
                  update("variants", form.variants.map((item, itemIndex) => (itemIndex === index ? { ...item, size: next } : item)))
                }
              />
              <ColorPicker
                disabled={!editable}
                value={variant.colour}
                onChange={(next) =>
                  update("variants", form.variants.map((item, itemIndex) => (itemIndex === index ? { ...item, colour: next } : item)))
                }
              />
              <button
                type="button"
                disabled={!editable || form.variants.length === 1}
                onClick={() => update("variants", form.variants.filter((_, itemIndex) => itemIndex !== index))}
                className="grid size-12 place-items-center rounded-[10px] bg-[#EAEBE7] disabled:opacity-40"
                aria-label="Remove variant"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </FormBlock>

      {editable ? (
        <div className="sticky bottom-3 space-y-2 rounded-[14px] bg-white/95 p-3 shadow-[0_3px_14px_rgba(0,0,0,0.12)] backdrop-blur">
          <MobileButton disabled={saving || uploading} onClick={() => void save(true)}>
            {saving ? <HookLoader size="button" /> : <><Send size={17} /> Submit for review</>}
          </MobileButton>
          <MobileButton variant="outline" disabled={saving || uploading} onClick={() => void save(false)}>
            {saving ? <HookLoader size="button" /> : <><Save size={17} /> Save draft</>}
          </MobileButton>
        </div>
      ) : null}
    </div>
  );
}

function FormBlock({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-[15px] font-semibold text-black">{title}</h2>
          {hint && <p className="mt-0.5 text-[12px] text-[#8F8F8F]">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4 rounded-[10px] bg-white p-4">{children}</div>
    </section>
  );
}

function MobileField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      {children}
      {error && <p className="text-[12px] font-medium text-amber-700">{error}</p>}
    </div>
  );
}
