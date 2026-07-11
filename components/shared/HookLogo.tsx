"use client";

import { cn } from "@/lib/utils";

interface HookLogoProps {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}

export function HookLogo({ className, markClassName, compact = false }: HookLogoProps) {
  return (
    <span className={cn("inline-flex items-baseline font-extrabold tracking-tight text-zinc-950", className)}>
      {compact ? (
        <span className={cn("flex size-8 items-center justify-center rounded-md bg-zinc-950 text-sm text-white", markClassName)}>
          h<span className="text-brand-gold">.</span>
        </span>
      ) : (
        <>
          hook<span className={cn("text-brand-gold", markClassName)}>.</span>
        </>
      )}
    </span>
  );
}
