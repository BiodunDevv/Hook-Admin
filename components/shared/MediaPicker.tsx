"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { CheckCircle2, GripVertical, ImagePlus, LinkIcon, RefreshCw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface MediaValue {
  url: string;
  secureUrl?: string;
  publicId?: string;
  source?: "cloudinary" | "external";
}

interface MediaPickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  description?: string;
  uploadFieldName?: string;
  uploadPath?: string;
  maxFiles?: number;
  className?: string;
}

function absoluteImageUrl(url: string) {
  if (url.startsWith("http")) return url;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${base}${url}`;
}

function splitLinks(value: string) {
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

export function MediaPicker({
  value,
  onChange,
  label = "Images",
  description = "Upload files to Cloudinary or paste direct image links.",
  uploadFieldName = "images",
  uploadPath = "/upload/images",
  maxFiles,
  className,
}: MediaPickerProps) {
  const [linkValue, setLinkValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [source, setSource] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const reactId = useId();
  const fileInputId = `media-upload-${reactId.replace(/:/g, "")}`;

  function addUrls(urls: string[]) {
    if (maxFiles === 1) {
      onChange(urls.slice(0, 1));
      return;
    }
    const next = [...value];
    urls.forEach((url) => {
      if (!next.includes(url)) next.push(url);
    });
    onChange(next);
  }

  async function uploadFiles(files: FileList | File[] | null) {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, maxFiles === 1 ? 1 : undefined);
    const formData = new FormData();
    selected.forEach((file) => formData.append(uploadFieldName, file));

    try {
      setIsUploading(true);
      const uploaded = await apiRequest<MediaValue[]>(uploadPath, {
        method: "POST",
        body: formData,
      });
      const urls = uploaded.map((item) => item.secureUrl || item.url).filter(Boolean);
      addUrls(urls);
      toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded to Cloudinary.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function addLinks() {
    const links = splitLinks(linkValue).slice(0, maxFiles === 1 ? 1 : undefined);
    if (!links.length) return;
    try {
      setIsUploading(true);
      const normalized = await apiRequest<MediaValue[]>(uploadPath, {
        method: "POST",
        body: JSON.stringify({ imageUrls: links }),
      });
      addUrls(normalized.map((item) => item.secureUrl || item.url).filter(Boolean));
      setLinkValue("");
      setSource("upload");
      toast.success(`${links.length} image${links.length === 1 ? "" : "s"} imported to Cloudinary.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Image link could not be added");
    } finally {
      setIsUploading(false);
    }
  }

  function removeUrl(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  function moveUrl(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  const isSingle = maxFiles === 1;
  const hasSingleImage = isSingle && value.length > 0;

  return (
    <div className={cn("space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label className="flex items-center gap-2">
            <ImagePlus size={15} /> {label}
          </Label>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        {hasSingleImage ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" /> Image ready</span> : null}
      </div>

      <Input id={fileInputId} type="file" accept="image/*" multiple={!isSingle} className="hidden" onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = ""; }} />

      {hasSingleImage ? (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="relative h-36 bg-zinc-100 sm:h-44">
            <Image src={absoluteImageUrl(value[0])} alt="Selected market image" fill className="object-cover" unoptimized />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent p-3 pt-12">
              <p className="truncate text-xs font-medium text-white">Hook-managed market image</p>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={isUploading} onClick={() => { setSource("upload"); document.getElementById(fileInputId)?.click(); }}><RefreshCw /> Replace</Button>
                <Button type="button" variant="secondary" size="sm" disabled={isUploading} onClick={() => setSource(source === "url" ? "upload" : "url")}><LinkIcon /> URL</Button>
                <Button type="button" variant="secondary" size="icon-sm" onClick={() => removeUrl(value[0])} aria-label="Remove market image"><X /></Button>
              </div>
            </div>
          </div>
          {source === "url" ? <div className="border-t p-4"><div className="space-y-1.5"><Label htmlFor={`${fileInputId}-replacement-link`}>Replace from URL</Label><Input id={`${fileInputId}-replacement-link`} type="url" value={linkValue} onChange={(event) => setLinkValue(event.target.value)} placeholder="https://example.com/market.jpg" /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">The current image stays in place until Hook imports the replacement to Cloudinary successfully.</p><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { setSource("upload"); setLinkValue(""); }}>Cancel</Button><Button type="button" variant="brand" size="sm" disabled={isUploading || !linkValue.trim()} onClick={() => void addLinks()}>{isUploading ? <HookLoader size="button" /> : "Import replacement"}</Button></div></div> : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 rounded-lg bg-zinc-200/70 p-1" role="tablist" aria-label="Choose image source">
            <button type="button" role="tab" aria-selected={source === "upload"} onClick={() => setSource("upload")} className={cn("flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition", source === "upload" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Upload className="size-4" /> Upload image</button>
            <button type="button" role="tab" aria-selected={source === "url"} onClick={() => setSource("url")} className={cn("flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition", source === "url" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><LinkIcon className="size-4" /> Import URL</button>
          </div>

          {source === "upload" ? (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => document.getElementById(fileInputId)?.click()}
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setIsDragging(false); void uploadFiles(event.dataTransfer.files); }}
              className={cn("flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-8 text-center transition", isDragging ? "border-[#c79b00] bg-[#fff9dc]" : "border-zinc-300 hover:border-[#d2aa14] hover:bg-[#fffdf4]")}
            >
              {isUploading ? <HookLoader label="Uploading to Cloudinary" /> : <><span className="grid size-11 place-items-center rounded-full bg-[#fff3ad] text-[#715800]"><Upload className="size-5" /></span><span className="mt-3 text-sm font-semibold text-foreground">Drop an image here or choose a file</span><span className="mt-1 text-xs leading-5 text-muted-foreground">PNG, JPG, or WebP. One clear landscape image works best.</span></>}
            </button>
          ) : (
            <div className="rounded-xl border bg-white p-4">
              <div className="space-y-1.5"><Label htmlFor={`${fileInputId}-links`}>Public image URL</Label><Input id={`${fileInputId}-links`} type="url" value={linkValue} onChange={(event) => setLinkValue(event.target.value)} placeholder="https://example.com/market.jpg" /></div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Hook imports the image into Cloudinary. The external URL is not stored as the market image.</p>
              <Button type="button" variant="brand" size="sm" className="mt-4 w-full sm:w-auto" disabled={isUploading || !linkValue.trim()} onClick={() => void addLinks()}>{isUploading ? <HookLoader size="button" /> : <><LinkIcon /> Import to Hook</>}</Button>
            </div>
          )}
        </>
      )}

      {!isSingle && value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <Image src={absoluteImageUrl(url)} alt={`Selected media ${index + 1}`} fill className="object-cover" unoptimized />
              <div className="absolute inset-x-1.5 top-1.5 hidden items-center justify-between gap-1 group-hover:flex">
                <div className="flex gap-1">
                  <button type="button" className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-500 shadow-sm" onClick={() => moveUrl(index, -1)} aria-label="Move image left">
                    <GripVertical size={13} />
                  </button>
                  <button type="button" className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-500 shadow-sm" onClick={() => moveUrl(index, 1)} aria-label="Move image right">
                    <GripVertical size={13} />
                  </button>
                </div>
                <button type="button" onClick={() => removeUrl(url)} className="grid size-7 place-items-center rounded-full bg-white/95 text-zinc-600 shadow-sm" aria-label="Remove image">
                  <X size={14} />
                </button>
              </div>
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 shadow-sm">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      ) : !isSingle ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-center text-sm text-zinc-500">
          No images selected yet. Upload files or add image links to preview them here.
        </div>
      ) : null}
    </div>
  );
}
