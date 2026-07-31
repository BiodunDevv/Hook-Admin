"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ImagePlus, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { ProductSubmission } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HookLoader } from "@/components/shared/HookLoader";

interface MarketOption { publicId: string; name: string }
interface CategoryOption { publicId: string; name: string }
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
    categorySuggestionId: submission?.categorySuggestionId || "",
    basicTitle: submission?.basicTitle || "",
    notes: submission?.notes || "",
    basePrice: submission ? String(submission.basePriceMinor / 100) : "",
    mediaIds: submission?.mediaIds || [],
    availabilityStatus: submission?.availabilityStatus || "available",
    availabilityNote: submission?.availabilityNote || "",
    internalSellerReference: "",
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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const editable = !submission || ["draft", "changes_requested"].includes(submission.status);
  const mediaReadiness = useQuery({
    queryKey: ["catalog-media-readiness"],
    queryFn: () => apiGet<MediaReadiness>("/catalog/media/readiness"),
    staleTime: 60_000,
    retry: 1,
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
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Submission could not be saved");
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
      const asset = await apiPost<{ publicId: string }>("/catalog/media/finalize", {
        uploadIntentId: intent.uploadIntentId,
        providerPublicId: provider.public_id,
        version: String(provider.version),
        ownerType: "submission",
      });
      update("mediaIds", [...form.mediaIds, asset.publicId]);
      toast.success("Image uploaded securely");
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 pb-24">
      {submission?.reviewNotes?.length ? (
        <Card className="border-amber-200 bg-amber-50 shadow-none"><CardHeader><CardTitle className="text-sm">Catalog Review feedback</CardTitle></CardHeader><CardContent className="space-y-2">{submission.reviewNotes.slice().reverse().map((note, index) => <div key={`${note.createdAt}-${index}`} className="text-sm"><span className="font-medium capitalize">{note.action.replaceAll("_", " ")}</span>{note.message ? `: ${note.message}` : ""}</div>)}</CardContent></Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle>Product capture</CardTitle></CardHeader><CardContent>
          <FieldGroup>
            <Field><FieldLabel>Product title</FieldLabel><Input disabled={!editable} value={form.basicTitle} onChange={(event) => update("basicTitle", event.target.value)} placeholder="Clear product name" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Assigned Market</FieldLabel><Select disabled={!editable} value={form.marketId} onValueChange={(value) => update("marketId", value)}><SelectTrigger><SelectValue placeholder="Select Market" /></SelectTrigger><SelectContent>{markets.map((market) => <SelectItem key={market.publicId} value={market.publicId}>{market.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field><FieldLabel>Suggested category</FieldLabel><Select disabled={!editable} value={form.categorySuggestionId} onValueChange={(value) => update("categorySuggestionId", value)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.publicId} value={category.publicId}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field><FieldLabel>Observed market price (NGN)</FieldLabel><Input disabled={!editable} inputMode="decimal" value={form.basePrice} onChange={(event) => update("basePrice", event.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" /></Field>
            <Field><FieldLabel>Capture notes</FieldLabel><Textarea disabled={!editable} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Materials, condition, distinguishing details, and seller context." className="min-h-32" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel>Availability</FieldLabel><Select disabled={!editable} value={form.availabilityStatus} onValueChange={(value) => update("availabilityStatus", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="limited">Limited</SelectItem><SelectItem value="unconfirmed">Unconfirmed</SelectItem></SelectContent></Select></Field>
              <Field><FieldLabel>Seller reference (internal)</FieldLabel><Input disabled={!editable} value={form.internalSellerReference} onChange={(event) => update("internalSellerReference", event.target.value)} placeholder="Stall or contact reference" /></Field>
            </div>
          </FieldGroup>
        </CardContent></Card>
        <div className="space-y-4">
          <Card className="rounded-lg shadow-none"><CardHeader><CardTitle>Media</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Upload at least one clear, original product image.</p>{mediaReadiness.isError || (mediaReadiness.isSuccess && !mediaAvailable) ? <Alert><AlertCircle /><AlertTitle>Secure uploads unavailable</AlertTitle><AlertDescription>Existing draft media remains safe. You can continue editing and save this draft, then upload images when the media service is restored.</AlertDescription></Alert> : null}<label className={`flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm ${editable && mediaAvailable && !uploading ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}><ImagePlus className="mb-2 size-5" />{mediaReadiness.isLoading || uploading ? <HookLoader size="inline" /> : mediaAvailable ? "Choose image" : "Upload unavailable"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={!editable || uploading || !mediaAvailable} onChange={(event) => void upload(event.target.files?.[0])} /></label>{form.mediaIds.map((id) => <div key={id} className="flex items-center justify-between rounded-md border p-2 text-xs"><span className="truncate">{id}</span><Button type="button" variant="ghost" size="icon-sm" disabled={!editable} onClick={() => update("mediaIds", form.mediaIds.filter((value) => value !== id))}><Trash2 /></Button></div>)}</CardContent></Card>
          <Card className="rounded-lg shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle>Variants</CardTitle><Button type="button" variant="outline" size="sm" disabled={!editable} onClick={() => update("variants", [...form.variants, { size: "", colour: "", attributes: {}, active: true }])}><Plus /> Add</Button></CardHeader><CardContent className="space-y-3">{form.variants.map((variant, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><Input disabled={!editable} placeholder="Size" value={variant.size} onChange={(event) => update("variants", form.variants.map((item, itemIndex) => itemIndex === index ? { ...item, size: event.target.value } : item))} /><Input disabled={!editable} placeholder="Colour" value={variant.colour} onChange={(event) => update("variants", form.variants.map((item, itemIndex) => itemIndex === index ? { ...item, colour: event.target.value } : item))} /><Button variant="ghost" size="icon" disabled={!editable || form.variants.length === 1} onClick={() => update("variants", form.variants.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}</CardContent></Card>
        </div>
      </div>
      {editable ? <div className="sticky bottom-3 flex justify-end gap-2 rounded-lg border bg-white/95 p-3 shadow-lg backdrop-blur"><Button variant="outline" disabled={saving || uploading} onClick={() => void save(false)}>{saving ? <HookLoader size="button" /> : <><Save /> Save draft</>}</Button><Button className="bg-[#FFC809] text-black hover:bg-[#f0bb00]" disabled={saving || uploading} onClick={() => void save(true)}>{saving ? <HookLoader size="button" /> : <><Send /> Submit for review</>}</Button></div> : null}
    </div>
  );
}
