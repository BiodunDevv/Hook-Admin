"use client";

import { cn } from "@/lib/utils";
import {
  APP_ACTION_BAR_BOTTOM,
  APP_ACTION_BAR_HEIGHT,
} from "@/lib/tab-bar-layout";

/** Docked primary action bar mirroring the tab bar's styling; pages must add its extra bottom padding. */
export function StickyActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ bottom: `calc(${APP_ACTION_BAR_BOTTOM}px + var(--safe-bottom))` }}
    >
      <div
        className={cn(
          "flex w-full max-w-lg items-center gap-2 rounded-[31px] border border-black/5 bg-white/95 px-2 shadow-[0_3px_14px_rgba(0,0,0,0.16)] backdrop-blur",
          className,
        )}
        style={{ minHeight: APP_ACTION_BAR_HEIGHT }}
      >
        {children}
      </div>
    </div>
  );
}

/** Compact button height so the stack stays tight against the 60px tab bar. */
export const ACTION_BAR_BUTTON = "min-h-[44px] text-[14px]";
