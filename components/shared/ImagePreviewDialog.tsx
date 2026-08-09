"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ImagePreviewDialog({
  open,
  onOpenChange,
  src,
  alt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string | null;
  alt: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden border-0 bg-zinc-950 p-2 sm:p-3">
        <DialogHeader className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>Image preview</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-[45vh] place-items-center rounded-lg bg-black/40 p-2 sm:min-h-[65vh]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="max-h-[78vh] w-full object-contain" />
          ) : (
            <p className="text-sm text-zinc-400">Image unavailable</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
