"use client";

import { cn } from "@/lib/utils";

interface HookLoaderProps {
  label?: string;
  size?: "page" | "inline" | "button";
  variant?: "yellow" | "dark";
  className?: string;
}

export function HookLoader({ label, size = "inline", variant, className }: HookLoaderProps) {
  const showLabel = Boolean(label && size !== "button");
  const tone = variant || (size === "button" ? "dark" : "yellow");

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      role={label ? "status" : undefined}
      aria-label={label}
    >
      <div
        aria-hidden="true"
        className={cn(
          "loader",
          tone === "dark" ? "hook-loader-dark" : "hook-loader-yellow",
          size === "button" && "hook-loader-button",
          size === "inline" && "hook-loader-inline",
          size === "page" && "hook-loader-page",
        )}
      />
      {showLabel && <span className="text-sm text-zinc-500">{label}</span>}
    </div>
  );
}
