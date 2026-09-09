"use client";

import { useState } from "react";
import { RefreshCw, Wrench } from "lucide-react";
import { HookLogo } from "@/components/shared/HookLogo";
import { useQueryClient } from "@tanstack/react-query";

const footerCopy = {
  customer: "Your account and cart are safe.",
  staff: "Your session and pending work are safe — nothing is lost.",
} as const;

/**
 * Shown wherever a guard finds the backend unreachable — the launch screen,
 * the login page, the admin dashboard shell, and the Market Associate/
 * Partner portal shell all render this instead of hanging on a spinner that
 * can never resolve. Centered the same way the launch screen is, so the
 * hand-off between the two reads as one continuous screen rather than a
 * layout jump.
 *
 * Defaults to invalidating the shared `useBackendHealth` query; pass
 * `onRetry` for a caller (like the launch screen) that manages its own
 * health-check loop instead of using that hook.
 *
 * `audience` swaps the reassurance line: "cart" only means something to a
 * Market Associate or Partner — Admin staff don't have one, so they get
 * operational phrasing instead. Defaults to "customer" since that's the
 * more common audience across the two portals this is built for; Admin's
 * guard passes "staff" explicitly.
 */
export function MaintenanceScreen({
  onRetry,
  audience = "customer",
}: {
  onRetry?: () => Promise<void> | void;
  audience?: keyof typeof footerCopy;
}) {
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  async function retryNow() {
    setRetrying(true);
    if (onRetry) await onRetry();
    else await queryClient.invalidateQueries({ queryKey: ["backend-health"] });
    setRetrying(false);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FFC809] px-6 py-10 text-center">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        <HookLogo className="text-3xl" />
        <div className="mt-10 flex size-16 items-center justify-center rounded-[22px] bg-black">
          <Wrench size={29} className="text-[#FFC809]" />
        </div>
        <h1 className="mt-7 text-[28px] font-black leading-9 text-black">
          Hook is under maintenance
        </h1>
        <p className="mt-4 max-w-[330px] text-[15px] leading-6 text-black/60">
          We cannot reach Hook right now. Our team is working to bring
          everything back online.
        </p>
        <button
          type="button"
          onClick={() => void retryNow()}
          disabled={retrying}
          className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-black px-6 text-[15px] font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {retrying ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <RefreshCw size={16} />
          )}
          Try again
        </button>
      </div>
      <p className="text-xs font-semibold text-black/45">{footerCopy[audience]}</p>
    </div>
  );
}
