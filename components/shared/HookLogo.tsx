"use client";

import { cn } from "@/lib/utils";

interface HookLogoProps {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}

export function HookLogo({ className, markClassName, compact = false }: HookLogoProps) {
  return (
    <span className={cn("inline-flex items-baseline font-extrabold tracking-tight text-current", className)}>
      <span className={compact ? "text-[0.9em]" : undefined}>hook</span>
      <span className={cn("text-brand-gold", markClassName)}>.</span>
    </span>
  );
}
