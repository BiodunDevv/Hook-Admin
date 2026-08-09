"use client";

import { useState } from "react";
import { ImageOff, Store } from "lucide-react";

export function MarketImage({
  src,
  alt,
  className = "",
  iconOnly = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-[#f4f3ef] text-[#9a8b4f] ${className}`} aria-label={`${alt} image unavailable`}>
        {iconOnly ? <Store className="size-6" /> : <div className="flex flex-col items-center gap-1.5 text-center"><ImageOff className="size-6" /><span className="text-[11px] font-medium">Market image unavailable</span></div>}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
