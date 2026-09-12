"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

/**
 * Sits above the sticky header in normal document flow (rendered by
 * AppTabBarShell, which owns the count fetch and the safe-area padding for
 * whichever of the two elements ends up first) — visible at the top of the
 * page, scrolling away with content so the header settles flush against the
 * viewport top once you scroll past it, rather than floating as a fixed
 * overlay competing for space.
 *
 * Renders one row per active alert — a submission sent back for changes and
 * a live product needing an availability re-check are unrelated workflows,
 * so each gets its own row (and its own tap target) rather than being merged
 * into one message.
 */
export function ChangesRequestedBanner({ alerts }: { alerts: { message: string; href: string }[] }) {
  return (
    <div className="relative z-50">
      {alerts.map((alert) => (
        <Link
          key={alert.href}
          href={alert.href}
          className="block overflow-hidden bg-red-600 text-white"
          aria-label={alert.message}
        >
          <div className="flex h-9 items-center gap-2 px-3">
            <TriangleAlert className="size-4 shrink-0 animate-pulse" aria-hidden />
            {/* Two identical copies back to back; the shared marquee animation
                shifts the pair left by half its width for a seamless loop. */}
            <div className="flex flex-1 overflow-hidden">
              <div className="hook-marquee-track flex shrink-0 whitespace-nowrap">
                <span className="pr-12 text-[13px] font-semibold">{alert.message}</span>
                <span className="pr-12 text-[13px] font-semibold" aria-hidden>{alert.message}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
