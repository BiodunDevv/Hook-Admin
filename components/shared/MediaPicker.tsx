"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { GripVertical, ImagePlus, LinkIcon, Upload, X } from "lucide-react";
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
  className,
}: MediaPickerProps) {
  const [linkValue, setLinkValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const reactId = useId();
  const fileInputId = `media-upload-${reactId.replace(/:/g, "")}`;

  function addUrls(urls: string[]) {
    const next = [...value];
    urls.forEach((url) => {
      if (!next.includes(url)) next.push(url);
    });
    onChange(next);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append(uploadFieldName, file));

    try {
      setIsUploading(true);
      const uploaded = await apiRequest<MediaValue[]>("/upload/images", {
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
    const links = splitLinks(linkValue);
    if (!links.length) return;
    try {
      const normalized = await apiRequest<MediaValue[]>("/upload/images", {
        method: "POST",
        body: JSON.stringify({ imageUrls: links }),
      });
      addUrls(normalized.map((item) => item.url));
      setLinkValue("");
      toast.success(`${links.length} image link${links.length === 1 ? "" : "s"} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Image link could not be added");
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

  return (
    <div className={cn("space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label htmlFor={fileInputId} className="flex items-center gap-2">
            <ImagePlus size={15} /> {label}
          </Label>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => document.getElementById(fileInputId)?.click()}>
          {isUploading ? <HookLoader size="button" label="Uploading..." /> : <><Upload size={14} /> Upload</>}
        </Button>
      </div>

      <Input id={fileInputId} type="file" accept="image/*" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files)} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor={`${fileInputId}-links`} className="flex items-center gap-2 text-xs text-zinc-600">
            <LinkIcon size={13} /> Image URLs
          </Label>
          <Input
            id={`${fileInputId}-links`}
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="Paste one or more image links, separated by commas"
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="self-end" onClick={addLinks}>
          Add link
        </Button>
      </div>

      {value.length > 0 ? (
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
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-center text-sm text-zinc-500">
          No images selected yet. Upload files or add image links to preview them here.
        </div>
      )}
    </div>
  );
}
