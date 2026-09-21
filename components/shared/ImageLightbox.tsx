"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/** Full-screen gallery: arrow keys and swipe-free buttons to move, Escape to close, thumbnails to jump. */
export function ImageLightbox({ images, index, onIndexChange, onClose, alt }: { images: string[]; index: number | null; onIndexChange: (index: number) => void; onClose: () => void; alt: string }) {
  const open = index !== null && images.length > 0;
  const step = useCallback((delta: number) => onIndexChange(((index ?? 0) + delta + images.length) % images.length), [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, onClose, step]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={`${alt} gallery`} className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-4" onClick={onClose}>
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>{(index ?? 0) + 1} / {images.length}</span>
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close"><X size={18} /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={(event) => event.stopPropagation()}>
        {images.length > 1 ? <button type="button" onClick={() => step(-1)} className="absolute left-0 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous image"><ChevronLeft /></button> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index ?? 0]} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 ? <button type="button" onClick={() => step(1)} className="absolute right-0 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next image"><ChevronRight /></button> : null}
      </div>
      <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1" onClick={(event) => event.stopPropagation()}>
        {images.map((src, position) => (
          <button key={`${src}-${position}`} type="button" onClick={() => onIndexChange(position)} className={`size-14 shrink-0 overflow-hidden rounded-md border-2 ${position === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`} aria-label={`Show image ${position + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
