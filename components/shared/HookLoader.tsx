"use client";

import { cn } from "@/lib/utils";

interface HookLoaderProps {
  label?: string;
  size?: "page" | "inline" | "button";
  className?: string;
}

export function HookLoader({ label, size = "inline", className }: HookLoaderProps) {
  const showLabel = Boolean(label && size !== "button");

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      role={label ? "status" : undefined}
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className={cn(
          "hook-loader",
          size === "button" && "hook-loader-button",
          size === "inline" && "hook-loader-inline",
          size === "page" && "hook-loader-page",
        )}
      />
      {showLabel && <span className="text-sm text-zinc-500">{label}</span>}
    </div>
  );
}
